# Lab Cyber – Makefile
# Usage : make [cible]
# make help pour la liste des cibles

.PHONY: help up down build rebuild test test-full test-full-report test-require-lab test-report test-e2e tests logs shell shell-attacker clean clean-all proxy up-proxy down-proxy blue up-blue down-blue status lab up-minimal ports dev restart restart-clean restart-clean-all terminal-html start

# Dossier du projet (racine)
ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

help:
	@echo "Lab Cyber – Cibles Make"
	@echo "================================"
	@echo ""
	@echo "  Interface web : http://127.0.0.1:4080   |   Terminal : http://127.0.0.1:4080/terminal/"
	@echo ""
	@echo "  Démarrer / arrêter"
	@echo "  ------------------"
	@echo "  make up             Démarrer les conteneurs (sans rebuild)"
	@echo "  make down           Tout arrêter (lab + lab-minimal), libérer les ports"
	@echo "  make dev            Reconstruire si besoin + démarrer (recommandé)"
	@echo "  make build          Reconstruire les images (sans démarrer)"
	@echo ""
	@echo "  Redémarrage et nettoyage"
	@echo "  -------------------------"
	@echo "  make start          down + build platform (--no-cache) + dev + status (rebuild complet puis état)"
	@echo "  make restart        down puis up (redémarrage rapide, pas de rebuild)"
	@echo "  make restart-clean  down + clean + up (arrêt, rebuild plateforme sans perdre les données, puis up)"
	@echo "  make restart-clean-all  down + clean-all + up (tout supprimer y compris volumes, rebuild, up)"
	@echo "  make rebuild        down + build + up (reconstruire toutes les images puis up)"
	@echo ""
	@echo "  make clean          Arrêter + reconstruire la plateforme (--no-cache), sans supprimer les volumes"
	@echo "  make clean-all      Arrêter + supprimer les volumes (toutes les données effacées)"
	@echo ""
	@echo "  Autres"
	@echo "  ------"
	@echo "  make status         État des conteneurs"
	@echo "  make logs           Suivi des logs (reconnexion auto après restart) — make logs LOGFILE=lab.log pour sauvegarder"
	@echo "  make logs-SVC       Logs d'un service (ex: make logs-gateway)"
	@echo "  make terminal-html  Verifier que l'injection exit est OK (page /terminal/)"
	@echo "  make shell          Shell dans le conteneur attaquant"
	@echo "  make test            Tests automatisés (15 blocs : structure, JSON, HTTP, store, etc.)"
	@echo "  make test-full       Tests complets (nécessite lab up)"
	@echo "  make test-e2e        Tests E2E navigateur (Playwright dans Docker) — lance make up si besoin"
	@echo "  make test-report     Tests → test-results.txt  |  make test-full-report  → test-full-results.txt"
	@echo "  make tests           TOUT : up + test-report + test-full-report + test-e2e (rapports complets)"
	@echo "  make up-minimal     Mode minimal  |  make proxy  Lab + Squid  |  make blue  Blue Team"
	@echo "  make ports          Voir qui utilise 4080/7681"
	@echo ""

# Démarrer sans rebuild (rapide si les images sont déjà à jour)
up:
	cd $(ROOT) && docker compose up -d
	@echo ""
	@echo "  Interface web (lab) : http://127.0.0.1:4080"
	@echo "  Terminal (navigateur) : http://127.0.0.1:4080/terminal/  |  CLI : make shell"
	@echo ""

# Rebuild complet : down, rebuild plateforme (--no-cache), dev, puis status
start: down
	cd $(ROOT) && docker compose build platform --no-cache
	cd $(ROOT) && docker compose up -d --build
	$(MAKE) status
	@echo ""
	@echo "  Interface : http://127.0.0.1:4080   |   Terminal (panel / PiP / nouvel onglet) : lab-terminal"
	@echo ""

# Tout arrêter (lab + lab-minimal), libérer les ports
down:
	cd $(ROOT) && docker compose down --remove-orphans
	cd $(ROOT) && COMPOSE_PROJECT_NAME=lab-minimal docker compose -f docker-compose.minimal.yml down --remove-orphans 2>/dev/null || true
	@echo "Lab arrêté. Ports libérés."

# Tout arrêter puis redémarrer (pas de rebuild)
restart: down
	cd $(ROOT) && docker compose up -d
	@echo ""
	@echo "  Interface web : http://127.0.0.1:4080   |   Terminal : http://127.0.0.1:4080/terminal/"
	@echo ""

# Arrêter + clean (rebuild plateforme sans supprimer les volumes) + démarrer
restart-clean: clean
	cd $(ROOT) && docker compose up -d
	@echo ""
	@echo "  restart-clean terminé. Interface : http://127.0.0.1:4080   |   make shell"
	@echo ""

# Arrêter + supprimer volumes + rebuild plateforme + démarrer
restart-clean-all: clean-all
	cd $(ROOT) && docker compose build --no-cache platform
	cd $(ROOT) && docker compose up -d
	@echo ""
	@echo "  restart-clean-all terminé (volumes supprimés). Interface : http://127.0.0.1:4080"
	@echo ""

# Tout arrêter + reconstruire les images + redémarrer (pour tester les modifs plateforme, etc.)
rebuild: down
	cd $(ROOT) && docker compose build
	cd $(ROOT) && docker compose up -d
	@echo ""
	@echo "  Rebuild terminé. Interface web (lab) : http://127.0.0.1:4080"
	@echo "  Terminal : http://127.0.0.1:4080/terminal/  |  make shell"
	@echo ""

# Reconstruire les images si besoin + démarrer (tout faire fonctionner, ex. gateway/nginx.conf)
dev:
	cd $(ROOT) && docker compose up -d --build
	@echo ""
	@echo "  Interface web (lab) : http://127.0.0.1:4080"
	@echo "  Terminal (navigateur) : http://127.0.0.1:4080/terminal/  |  CLI : make shell"
	@echo "  (Tout le lab passe par le port 4080 ; le port 5000 est l'API vuln interne, pas l'interface.)"
	@echo ""

build:
	cd $(ROOT) && docker compose build

status:
	cd $(ROOT) && docker compose ps

# Tests : par défaut, les tests 2–6 sont skippés si le lab n’est pas up
test:
	cd $(ROOT) && ./scripts/run-tests.sh

# Tests avec rapport écrit dans test-results.txt
test-report:
	cd $(ROOT) && TEST_REPORT=test-results.txt ./scripts/run-tests.sh
	@echo "  Rapport tests : $(ROOT)test-results.txt"

# Tests complets (lab requis) avec rapport test-full-results.txt
test-full-report:
	cd $(ROOT) && TEST_REQUIRE_LAB=1 TEST_REPORT=test-full-results.txt ./scripts/run-tests.sh
	@echo "  Rapport test-full : $(ROOT)test-full-results.txt"

# Suite complète : lab up, puis test-report + test-full-report + test-e2e. Tous les rapports sont générés.
tests:
	@echo "  [tests] Démarrage du lab..."
	cd $(ROOT) && docker compose up -d
	@echo "  [tests] Attente des services (8 s)..."
	@sleep 8
	@echo "  [tests] 1/3 — Tests automatisés (rapport test-results.txt)"
	@$(MAKE) -C $(ROOT) test-report
	@echo "  [tests] 2/3 — Tests complets avec lab (rapport test-full-results.txt)"
	@$(MAKE) -C $(ROOT) test-full-report
	@echo "  [tests] 3/3 — Tests E2E (Playwright)"
	cd $(ROOT) && docker compose --profile e2e run --rm e2e
	@echo ""
	@echo "  === Tous les tests terminés ==="
	@echo "  Rapports : test-results.txt, test-full-results.txt, e2e/test-results/ et playwright-report/ (si généré)"

# Tests E2E (Playwright) : exécutés dans un conteneur Docker, uniquement via Makefile.
# Image : mcr.microsoft.com/playwright:v1.58.2-noble. Suites : Navigation + Terminal (e2e/app.spec.js).
# Démarre gateway (et dépendances) si besoin, puis lance le conteneur e2e.
test-e2e:
	@echo "  [test-e2e] Démarrage des services si besoin..."
	cd $(ROOT) && docker compose up -d gateway
	@echo "  [test-e2e] Attente gateway (5 s)..."
	@sleep 5
	@echo "  [test-e2e] Lancement des tests E2E (Navigation, Terminal, Vues, Barre scénario, Cibles, Bureau)..."
	cd $(ROOT) && docker compose --profile e2e run --rm e2e

# Exiger que le lab soit démarré pour les tests
test-full: test-require-lab

test-require-lab:
	cd $(ROOT) && TEST_REQUIRE_LAB=1 ./scripts/run-tests.sh

# Shell dans le conteneur attaquant (session d’attaque)
shell: shell-attacker

shell-attacker:
	cd $(ROOT) && docker compose exec attaquant bash

# Logs : suivi en direct. Ne se coupe pas : en cas de redémarrage (make restart ailleurs), les logs reprennent seuls après 2 s.
# Optionnel : make logs LOGFILE=lab.log écrit aussi dans lab.log (historique conservé).
# Ctrl+C pour arrêter.
logs:
	@echo "  Suivi des logs (Ctrl+C pour quitter). En cas de make restart ailleurs, reconnexion auto."
	@if [ -n "$(LOGFILE)" ]; then echo "  Écriture supplémentaire dans $(LOGFILE)"; fi
	@echo ""
	@while true; do \
		cd $(ROOT) && ( [ -n "$(LOGFILE)" ] && docker compose logs -f 2>&1 | tee -a "$(LOGFILE)" || docker compose logs -f ) 2>/dev/null || true; \
		echo ""; echo "  [logs] Conteneurs arrêtés ou redémarrage — reconnexion dans 2 s..."; \
		sleep 2; \
	done

# Règle générique logs-<service> (ex: make logs-gateway)
logs-%:
	cd $(ROOT) && docker compose logs -f $*

# Verifier que l'injection exit est dans la page /terminal/ (resultat affiche ici, pas de fichier a ouvrir)
terminal-html:
	@port=$${GATEWAY_PORT:-4080}; \
	echo "  Verification http://127.0.0.1:$$port/terminal/ ..."; \
	body=$$(curl -sS "http://127.0.0.1:$$port/terminal/" 2>/dev/null); \
	if [ -z "$$body" ]; then echo "  Erreur : pas de reponse. Lab demarre ? (make up)"; exit 1; fi; \
	if echo "$$body" | grep -q "lab-cyber-terminal-exit"; then \
	  echo "  Injection exit : OK. Taper exit dans le terminal panneau/PiP fermera l'onglet."; \
	else \
	  echo "  Injection exit : ABSENTE. Faire : make dev  puis reessayer."; exit 1; \
	fi

# Proxy Squid (profil proxy)
proxy:
	cd $(ROOT) && docker compose --profile proxy up -d
	@echo "Lab + Proxy Squid démarrés. Proxy HTTP : localhost:3128"

up-proxy:
	cd $(ROOT) && docker compose --profile proxy up -d proxy

down-proxy:
	cd $(ROOT) && docker compose --profile proxy stop proxy 2>/dev/null || true

# Bureau noVNC (démarre avec make dev ; cible pour rappel)
desktop:
	cd $(ROOT) && docker compose up -d
	@echo "Bureau noVNC : http://127.0.0.1:4080/desktop/  (mot de passe VNC : alpine)"

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
	@echo "Lab minimal démarré. Plateforme : http://lab.local:$${GATEWAY_PORT:-4090}"

# Binaire C unique (pilote tout : ./lab up | down | test | minimal | shell)
lab:
	$(CC) -o $(ROOT)lab $(ROOT)src/lab.c
	@echo "Binaire généré : ./lab   (utilisez ./lab help)"

# Voir quel processus utilise les ports du lab (en cas d'erreur "port already allocated")
ports:
	@echo "Qui utilise les ports du lab (4080, 7681) ?"
	@ss -tlnp 2>/dev/null | grep -E ':4080|:7681' || true
	@echo "Pour libérer : make down. Pour changer : .env (GATEWAY_PORT, TTYD_PORT) puis make up."

# Nettoyage : arrêter les conteneurs, reconstruire la plateforme (--no-cache). Ne supprime PAS les volumes.
clean:
	cd $(ROOT) && docker compose --profile proxy --profile blue down --remove-orphans
	cd $(ROOT) && docker compose -f docker-compose.minimal.yml down --remove-orphans 2>/dev/null || true
	cd $(ROOT) && docker compose build --no-cache platform
	@echo "Conteneurs arrêtés, image plateforme reconstruite (données conservées). Lancez : make up ou make restart-clean pour enchaîner avec up."

# Nettoyage total : conteneurs + volumes (toutes les données supprimées)
clean-all:
	cd $(ROOT) && docker compose --profile proxy --profile blue down -v
	cd $(ROOT) && docker compose -f docker-compose.minimal.yml down -v 2>/dev/null || true
	@echo "Conteneurs et volumes supprimés."
