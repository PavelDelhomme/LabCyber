# Lab Cyber – Makefile
# Usage : make [cible]
# make help pour la liste des cibles

.PHONY: help up down build test test-full test-require-lab logs shell shell-attacker clean proxy up-proxy down-proxy blue up-blue down-blue status lab up-minimal ports dev restart

# Dossier du projet (racine)
ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

help:
	@echo "Lab Cyber – Cibles principales"
	@echo ""
	@echo "  make up           Démarrer tout le lab (conteneurs)"
	@echo "  make down         Arrêter le lab (et lab-minimal), libérer les ports"
	@echo "  make up-minimal   Démarrer le lab en mode minimal (peu de ressources)"
	@echo "  make build        Reconstruire les images"
	@echo "  make status       Afficher l’état des conteneurs"
	@echo ""
	@echo "  make test         Lancer tous les tests du système"
	@echo "  make test-full    Idem mais exige que le lab soit démarré"
	@echo ""
	@echo "  make shell        Ouvrir un shell dans le conteneur attaquant (session lab)"
	@echo "  make logs         Afficher les logs de tous les services"
	@echo "  make logs-SVC     Logs du service SVC (ex: make logs-platform)"
	@echo ""
	@echo "  make lab          Compiler le binaire C ./lab (up, down, test, minimal, shell)"
	@echo "  make proxy        Démarrer le lab + proxy Squid (port 3128)"
	@echo "  make blue         Démarrer le lab avec profil Blue Team (Suricata)"
	@echo ""
	@echo "  make clean        Arrêter et supprimer conteneurs + volumes"
	@echo "  make ports        Voir qui utilise les ports 8080 et 7681 (si make up échoue)"
	@echo ""
	@echo "  make dev          Lancer la plateforme web en mode dev avec hot reload (port 3000)"
	@echo "  make restart      Redémarrer le lab (down puis up)"
	@echo ""

# Démarrer le lab (sans proxy ni blue)
up:
	cd $(ROOT) && docker compose up -d
	@echo "Lab démarré. Plateforme : http://127.0.0.1:8080  |  Terminal : http://localhost:7681  |  make shell"

# Arrêter le lab (et lab-minimal si actif) pour libérer les ports
down:
	cd $(ROOT) && docker compose down --remove-orphans
	cd $(ROOT) && COMPOSE_PROJECT_NAME=lab-minimal docker compose -f docker-compose.minimal.yml down --remove-orphans 2>/dev/null || true
	@echo "Lab arrêté. Ports libérés."

# Redémarrer le lab (arrêt puis redémarrage)
restart: down
	cd $(ROOT) && docker compose up -d
	@echo "Lab redémarré. Plateforme : http://127.0.0.1:8080  |  Terminal : http://localhost:7681"

# Plateforme web en mode dev avec hot reload (port 3000)
dev:
	@command -v npm >/dev/null 2>&1 || { echo "Erreur: npm requis (installez Node.js)."; exit 1; }
	@test -d node_modules || (cd $(ROOT) && npm install)
	cd $(ROOT) && npm run dev

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
