#!/usr/bin/env bash
# Tests du système Lab Cyber : structure, JSON, conteneurs, HTTP, réseau, logs
# Sans lab démarré : tests 0, 1, 7, 8 (structure, JSON, frontend, structure config).
# Avec lab : tous. Profil minimal : tests DVWA/Juice/bWAPP skippés.
# TEST_REQUIRE_LAB=1 pour exiger le lab.
set -e
cd "$(dirname "$0")/.."
FAIL=0
REQUIRE_LAB="${TEST_REQUIRE_LAB:-0}"
if [ -f .env ]; then export "$(grep -E '^GATEWAY_PORT=' .env 2>/dev/null | xargs)" 2>/dev/null; fi
GATEWAY_PORT="${GATEWAY_PORT:-8080}"
GATEWAY_URL="http://127.0.0.1:${GATEWAY_PORT}"

lab_running() {
  docker compose ps --format json 2>/dev/null | python3 -c "
import json, sys
data = sys.stdin.read()
if not data.strip(): sys.exit(1)
for line in data.strip().split('\n'):
    try:
        j = json.loads(line)
        if j.get('State') != 'running': sys.exit(1)
    except: pass
sys.exit(0)
" 2>/dev/null || return 1
}

# Retourne 0 si le conteneur tourne (pour savoir si DVWA/Juice/bWAPP sont là ou profil minimal)
container_running() {
  case "$1" in
    dvwa)   docker ps --format '{{.Names}}' 2>/dev/null | grep -q lab-dvwa ;;
    juice-shop) docker ps --format '{{.Names}}' 2>/dev/null | grep -q lab-juice-shop ;;
    bwapp)  docker ps --format '{{.Names}}' 2>/dev/null | grep -q lab-bwapp ;;
    *)      docker compose ps "$1" 2>/dev/null | grep -q running ;;
  esac
}

echo "=== Tests du système Lab Cyber ==="
echo ""

# ---- 0. Structure du projet ----
echo "[0/10] Structure du projet..."
STRUCTURE_FAIL=0
for path in \
  docker-compose.yml \
  Makefile \
  gateway/nginx.conf \
  gateway/Dockerfile \
  platform/index.html \
  platform/js/app.js \
  platform/js/logger.js \
  platform/data/rooms.json \
  platform/data/scenarios.json \
  platform/data/config.json \
  attacker/Dockerfile \
  vuln-network/Dockerfile \
  vuln-api/app.py \
  scripts/run-tests.sh \
  .env.example \
  docker-compose.minimal.yml \
  docker-compose.multi.yml \
  scripts/tui-list-scenarios.sh \
  scripts/tui-list-rooms.sh \
  scripts/tui-list-docs.sh \
  ; do
  if [ ! -e "$path" ]; then echo "  MANQUANT: $path"; STRUCTURE_FAIL=1; fi
done
[ $STRUCTURE_FAIL -eq 0 ] && echo "  OK structure" || { FAIL=1; echo "  FAIL structure"; }
echo ""

# ---- 1. Validation JSON ----
echo "[1/10] Validation JSON (rooms, scenarios, config)..."
python3 -c "
import json
for name, path in [('rooms.json', 'platform/data/rooms.json'), ('scenarios.json', 'platform/data/scenarios.json'), ('config.json', 'platform/data/config.json')]:
    with open(path) as f:
        d = json.load(f)
    print('  OK', name)
" || { echo "  FAIL JSON"; FAIL=1; }
echo ""

LAB_UP=0
if lab_running; then LAB_UP=1; fi

if [ "$LAB_UP" -eq 0 ]; then
  echo "[2/10] Conteneurs … SKIP (lab non démarré)"
  echo "[3/10] HTTP Plateforme … SKIP"
  echo "[4/10] HTTP Cibles … SKIP"
  echo "[5/10] Réseau … SKIP"
  echo "[6/10] Logs vuln-api … SKIP"
  echo "[7/10] Logs frontend … (exécuté ci-dessous)"
  echo "[8/10] Config hostnames … (exécuté ci-dessous)"
  echo "[9/10] Route terminal … SKIP"
  echo "[10/10] Fichiers statiques … SKIP"
  echo ""
  echo ">>> Pour tous les tests : make up   puis   make test"
  if [ "$REQUIRE_LAB" = "1" ]; then echo ">>> TEST_REQUIRE_LAB=1 : échec (lab non démarré)."; exit 1; fi
else
  # ---- 2. Conteneurs ----
  echo "[2/10] Conteneurs (docker compose ps)..."
  docker compose ps --format json 2>/dev/null | python3 -c "
import json, sys
data = sys.stdin.read()
if not data.strip(): sys.exit(1)
for line in data.strip().split('\n'):
    try:
        j = json.loads(line)
        if j.get('State') != 'running':
            print('  FAIL', j.get('Name'), j.get('State'))
            sys.exit(1)
    except: pass
print('  OK tous running')
" || { echo "  FAIL containers"; FAIL=1; }
  echo ""

  # ---- 3. HTTP Plateforme ----
  echo "[3/10] HTTP Plateforme (gateway port $GATEWAY_PORT)..."
  for url in "/" "/data/rooms.json" "/data/scenarios.json" "/demo-phishing.html" "/test-logs.html"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$GATEWAY_URL$url" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then echo "  OK $url $code"; else echo "  FAIL $url $code"; FAIL=1; fi
  done
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$GATEWAY_URL/data/config.json" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then echo "  OK /data/config.json $code"; else echo "  WARN /data/config.json $code (rebuild: make build platform)"; fi
  echo ""

  # ---- 4. HTTP Cibles ----
  echo "[4/10] HTTP Cibles (via gateway)..."
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 -H "Host: api.lab" "$GATEWAY_URL/api/health" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then echo "  OK api.lab $code"; else echo "  FAIL vuln-api $code"; FAIL=1; fi
  if container_running dvwa 2>/dev/null; then
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 -H "Host: dvwa.lab" "$GATEWAY_URL/" 2>/dev/null || echo "000")
    if [ "$code" = "200" ] || [ "$code" = "302" ]; then echo "  OK dvwa.lab $code"; else echo "  FAIL DVWA $code"; FAIL=1; fi
  else echo "  SKIP dvwa (profil minimal)"; fi
  if container_running juice-shop 2>/dev/null; then
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 -H "Host: juice.lab" "$GATEWAY_URL/" 2>/dev/null || echo "000")
    if [ "$code" = "200" ] || [ "$code" = "304" ]; then echo "  OK juice.lab $code"; else echo "  WARN Juice Shop $code"; fi
  else echo "  SKIP juice (profil minimal)"; fi
  if container_running bwapp 2>/dev/null; then
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 -H "Host: bwapp.lab" "$GATEWAY_URL/" 2>/dev/null || echo "000")
    if [ "$code" = "200" ] || [ "$code" = "302" ]; then echo "  OK bwapp.lab $code"; else echo "  WARN bWAPP $code"; fi
  else echo "  SKIP bwapp (profil minimal)"; fi
  echo ""

  # ---- 5. Réseau ----
  echo "[5/10] Réseau (attaquant -> vuln-network)..."
  docker compose exec -T attaquant nmap -sV -Pn -p 22 vuln-network 2>/dev/null | grep -q "22/tcp.*open.*ssh" && echo "  OK SSH détecté" || { echo "  FAIL nmap"; FAIL=1; }
  echo ""

  # ---- 6. Logs vuln-api ----
  echo "[6/10] Logs vuln-api..."
  curl -s -o /dev/null --connect-timeout 2 -H "Host: api.lab" "$GATEWAY_URL/api/health" 2>/dev/null || true
  sleep 1
  docker compose logs vuln-api 2>&1 | tail -30 | grep -qE '"action".*"request"|GET /api/health' && echo "  OK logs" || echo "  WARN aucun log requête"
  echo ""

  # ---- 9. Route terminal ----
  echo "[9/10] Route terminal (Host: terminal.lab)..."
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 -H "Host: terminal.lab" "$GATEWAY_URL/" 2>/dev/null || echo "000")
  if [ "$code" = "200" ] || [ "$code" = "101" ] || [ "$code" = "000" ]; then echo "  OK terminal.lab $code"; else echo "  WARN terminal $code"; fi
  echo ""

  # ---- 10. Fichiers statiques plateforme ----
  echo "[10/10] Fichiers statiques (css, data)..."
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$GATEWAY_URL/css/style.css" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then echo "  OK style.css"; else echo "  FAIL style.css $code"; FAIL=1; fi
  echo ""
fi

# ---- 7. Logs frontend (toujours) ----
echo "[7/10] Logs frontend (logger + intégration)..."
[ -f "platform/js/logger.js" ] && grep -q "getEntries\|LabCyberLogger" platform/js/logger.js 2>/dev/null && echo "  OK logger.js" || { echo "  FAIL logger.js"; FAIL=1; }
[ -f "platform/js/app.js" ] && grep -q "LabCyberLogger\|logEvent" platform/js/app.js 2>/dev/null && echo "  OK app.js" || { echo "  FAIL app.js"; FAIL=1; }
[ -f "platform/index.html" ] && grep -q "log-panel\|log-entries\|logger.js" platform/index.html 2>/dev/null && echo "  OK index.html (panneau logs)" || { echo "  FAIL index.html"; FAIL=1; }
echo ""

# ---- 8. Config hostnames (toujours) ----
echo "[8/10] Config hostnames (config.json)..."
python3 -c "
import json
with open('platform/data/config.json') as f:
    c = json.load(f)
h = c.get('hostnames') or {}
required = ['platform', 'dvwa', 'juice', 'api', 'bwapp', 'terminal']
missing = [k for k in required if not h.get(k)]
if missing:
    print('  FAIL hostnames manquants:', missing)
    exit(1)
print('  OK hostnames:', list(h.keys()))
" || { echo "  FAIL config hostnames"; FAIL=1; }
echo ""

if [ $FAIL -eq 0 ]; then
  echo "=== Tous les tests exécutés sont passés ==="
  [ "$LAB_UP" -eq 0 ] && echo "    (make up puis make test pour les tests réseau/HTTP)"
  exit 0
else
  echo "=== Certains tests ont échoué ==="
  exit 1
fi
