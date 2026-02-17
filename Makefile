# Lab Cyber – Makefile
# Usage : make [cible]
# make help pour la liste des cibles

.PHONY: help up down build test test-full test-require-lab logs shell shell-attacker clean proxy up-proxy down-proxy blue up-blue down-blue status lab up-minimal ports dev restart

# Dossier du projet (racine)
ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

help:
	@echo "Lab Cyber – Cibles principales"
	@echo ""
	@echo "  make dev          Reconstruire si besoin + démarrer tout (recommandé)"
	@echo "  make up           Démarrer sans rebuild (rapide)"
	@echo "  make down         Tout arrêter (lab + lab-minimal)"
	@echo "  make restart      Arrêter puis redémarrer (down + up)"
	@echo "  make build        Reconstruire les images (sans démarrer)"
	@echo "  make status       État des conteneurs"
	@echo ""
	@echo "  make up-minimal   Mode minimal  |  make test  tests  |  make shell  conteneur attaquant"
	@echo "  make logs         Logs  |  make logs-SVC  (ex: make logs-gateway)"
	@echo "  make proxy        Lab + Squid (3128)  |  make blue  Blue Team  |  make desktop  Bureau noVNC (XFCE)"
	@echo "  make clean        Tout arrêter + supprimer volumes  |  make ports  Qui utilise 8080/7681"
	@echo ""

# Démarrer sans rebuild (rapide si les images sont déjà à jour)
up:
	cd $(ROOT) && docker compose up -d
	@echo "Plateforme : http://127.0.0.1:8080  |  Terminal : http://127.0.0.1:8080/terminal/  |  make shell"

# Tout arrêter (lab + lab-minimal), libérer les ports
down:
	cd $(ROOT) && docker compose down --remove-orphans
	cd $(ROOT) && COMPOSE_PROJECT_NAME=lab-minimal docker compose -f docker-compose.minimal.yml down --remove-orphans 2>/dev/null || true
	@echo "Lab arrêté. Ports libérés."

# Tout arrêter puis redémarrer (pas de rebuild)
restart: down
	cd $(ROOT) && docker compose up -d
	@echo "Plateforme : http://127.0.0.1:8080  |  Terminal : http://127.0.0.1:8080/terminal/"

# Reconstruire les images si besoin + démarrer (tout faire fonctionner, ex. gateway/nginx.conf)
dev:
	cd $(ROOT) && docker compose up -d --build
	@echo "Plateforme : http://127.0.0.1:8080  |  Terminal : http://127.0.0.1:8080/terminal/  |  make shell"

build:
	cd $(ROOT) && docker compose build

status:
	cd $(ROOT) && docker compose ps

# Tests : par défaut, les tests 2–6 sont skippés si le lab n’est pas up
test:
	cd $(ROOT) && ./scripts/run-tests.sh

# Exiger que le lab soit démarré pour les tests
test-full: test-require-lab

test-require-lab:
	cd $(ROOT) && TEST_REQUIRE_LAB=1 ./scripts/run-tests.sh

# Shell dans le conteneur attaquant (session d’attaque)
shell: shell-attacker

shell-attacker:
	cd $(ROOT) && docker compose exec attaquant bash

# Logs
logs:
	cd $(ROOT) && docker compose logs -f

# Règle générique logs-<service>
logs-%:
	cd $(ROOT) && docker compose logs -f $*

# Proxy Squid (profil proxy)
proxy:
	cd $(ROOT) && docker compose --profile proxy up -d
	@echo "Lab + Proxy Squid démarrés. Proxy HTTP : localhost:3128"

up-proxy:
	cd $(ROOT) && docker compose --profile proxy up -d proxy

down-proxy:
	cd $(ROOT) && docker compose --profile proxy stop proxy 2>/dev/null || true

# Bureau noVNC (XFCE, type Kali – accès http://127.0.0.1:8080/desktop/)
desktop:
	cd $(ROOT) && docker compose --profile desktop up -d
	@echo "Bureau noVNC : http://127.0.0.1:8080/desktop/  (mot de passe VNC : alpine)"

# Blue Team (Suricata)
blue:
	cd $(ROOT) && docker compose --profile blue up -d
	@echo "Lab + Blue Team (Suricata) démarrés"

up-blue:
	cd $(ROOT) && docker compose --profile blue up -d blue-suricata

down-blue:
	cd $(ROOT) && docker compose --profile blue stop blue-suricata 2>/dev/null || true

# Lab minimal (peu de ressources : gateway, platform, attaquant, vuln-network, vuln-api uniquement)
up-minimal:
	cd $(ROOT) && docker compose -f docker-compose.minimal.yml up -d
	@echo "Lab minimal démarré. Plateforme : http://lab.local:$${GATEWAY_PORT:-8080}"

# Binaire C unique (pilote tout : ./lab up | down | test | minimal | shell)
lab:
	$(CC) -o $(ROOT)lab $(ROOT)src/lab.c
	@echo "Binaire généré : ./lab   (utilisez ./lab help)"

# Voir quel processus utilise les ports du lab (en cas d'erreur "port already allocated")
ports:
	@echo "Port 8080 (gateway) :"
	@ss -tlnp 2>/dev/null | grep :8080 || lsof -i :8080 2>/dev/null || echo "  (rien ou pas de droit)"
	@echo "Port 7681 (terminal ttyd) :"
	@ss -tlnp 2>/dev/null | grep :7681 || lsof -i :7681 2>/dev/null || echo "  (rien ou pas de droit)"
	@echo "Pour libérer : make down. Si besoin, change GATEWAY_PORT ou TTYD_PORT dans .env"

# Nettoyage complet (conteneurs + volumes)
clean:
	cd $(ROOT) && docker compose --profile proxy --profile blue down -v
	cd $(ROOT) && docker compose -f docker-compose.minimal.yml down -v 2>/dev/null || true
	@echo "Conteneurs et volumes supprimés."
