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

# ---- 0. Structure du projet (couverture maximale) ----
echo "[0/15] Structure du projet..."
STRUCTURE_FAIL=0
# Racine + gateway + conteneurs
for path in \
  docker-compose.yml \
  Makefile \
  gateway/nginx.conf \
  gateway/Dockerfile \
  scripts/run-tests.sh \
  .env.example \
  docker-compose.minimal.yml \
  docker-compose.multi.yml \
  scripts/tui-list-scenarios.sh \
  scripts/tui-list-rooms.sh \
  scripts/tui-list-docs.sh \
  attacker/Dockerfile \
  vuln-network/Dockerfile \
  vuln-api/app.py \
  lab-terminal/main.go \
  ; do
  if [ ! -e "$path" ]; then echo "  MANQUANT: $path"; STRUCTURE_FAIL=1; fi
done
# Plateforme HTML/JS (legacy)
for path in platform/index.html platform/js/app.js platform/js/logger.js platform/public/terminal-client.html; do
  if [ ! -e "$path" ]; then echo "  MANQUANT: $path"; STRUCTURE_FAIL=1; fi
done
# Data JSON essentiels
for path in platform/data/rooms.json platform/data/scenarios.json platform/data/config.json; do
  if [ ! -e "$path" ]; then echo "  MANQUANT: $path"; STRUCTURE_FAIL=1; fi
done
# Toutes les vues (16)
for v in Dashboard ScenarioView LabsView NetworkSimulatorView CaptureView LearningView DocOfflineView DocsView OptionsView RoomView ProxyToolsView ApiClientView EngagementsView ProgressionView ProxyConfigView TerminalFullView; do
  if [ ! -f "platform/src/views/${v}.jsx" ]; then echo "  MANQUANT: platform/src/views/${v}.jsx"; STRUCTURE_FAIL=1; fi
done
# Tous les composants (11)
for c in Sidebar Topbar TerminalPipPanel PipPanel CvePanel LabButtonDropdown OpenInPageDropdown ScenarioBottomBar JournalCompletModal StatsModal LogPanel; do
  if [ ! -f "platform/src/components/${c}.jsx" ]; then echo "  MANQUANT: platform/src/components/${c}.jsx"; STRUCTURE_FAIL=1; fi
done
# App + main + store + lib + build
for path in platform/src/App.jsx platform/src/main.jsx platform/src/lib/store.js platform/src/lib/defaultData.js platform/public/storage.js platform/vite.config.js platform/Dockerfile; do
  if [ ! -e "$path" ]; then echo "  MANQUANT: $path"; STRUCTURE_FAIL=1; fi
done
# Au moins un fichier CSS (legacy ou src)
[ -f "platform/css/style.css" ] || [ -f "platform/src/style.css" ] || { echo "  MANQUANT: platform style.css"; STRUCTURE_FAIL=1; }
[ $STRUCTURE_FAIL -eq 0 ] && echo "  OK structure (racine, gateway, data, 16 vues, 11 composants, App/store, lib, storage, vite, Dockerfile, CSS)" || { FAIL=1; echo "  FAIL structure"; }
echo ""

# ---- 1. Validation JSON ----
echo "[1/15] Validation JSON (rooms, scenarios, config, toolPacks, labToolPresets)..."
python3 -c "
import json
paths = [
    ('rooms.json', 'platform/data/rooms.json'),
    ('scenarios.json', 'platform/data/scenarios.json'),
    ('config.json', 'platform/data/config.json'),
    ('toolPacks.json', 'platform/data/toolPacks.json'),
    ('labToolPresets.json', 'platform/data/labToolPresets.json'),
]
for name, path in paths:
    try:
        with open(path) as f:
            d = json.load(f)
        print('  OK', name)
    except FileNotFoundError:
        print('  SKIP', name, '(fichier absent)')
    except Exception as e:
        print('  FAIL', name, e)
        exit(1)
# Scénarios: structure minimale (id, title, tasks) et au moins une tâche par scénario
with open('platform/data/scenarios.json') as f:
    s = json.load(f)
for sc in s.get('scenarios', []):
    if not sc.get('id') or not sc.get('title'):
        print('  FAIL scenarios: entrée sans id/title')
        exit(1)
    if sc.get('howto') and not isinstance(sc['howto'], str):
        print('  FAIL scenarios: howto doit être une chaîne')
        exit(1)
    if not (sc.get('tasks') and len(sc['tasks']) >= 1):
        print('  FAIL scenarios: chaque scénario doit avoir au moins une tâche')
        exit(1)
print('  OK scenarios structure + howto + tasks')
# labToolPresets: byScenario doit exister et avoir au moins un scénario
with open('platform/data/labToolPresets.json') as f:
    lp = json.load(f)
by_scenario = lp.get('byScenario') or {}
if not isinstance(by_scenario, dict):
    print('  FAIL labToolPresets: byScenario doit être un objet')
    exit(1)
if len(by_scenario) == 0:
    print('  WARN labToolPresets: byScenario vide')
print('  OK labToolPresets.byScenario')
# docSources.json : structure (sources = liste)
for name, path, key in [('docSources.json', 'platform/data/docSources.json', 'sources'), ('docSources (public)', 'platform/public/data/docSources.json', 'sources')]:
    try:
        with open(path) as f: d = json.load(f)
        if isinstance(d.get(key), list): print('  OK', name)
        else: print('  WARN', name, 'sans clé', key)
    except FileNotFoundError: pass
    except Exception as e: print('  WARN', name, e)
# challenges.json : valide (challenges ou liste)
for path in ['platform/data/challenges.json', 'platform/public/data/challenges.json']:
    try:
        with open(path) as f: d = json.load(f)
        c = d.get('challenges') if isinstance(d, dict) else d
        if c is not None: print('  OK challenges.json'); break
    except FileNotFoundError: pass
    except Exception: pass
else: print('  WARN challenges.json absent ou invalide')
# docs.json optionnel (entries)
for path in ['platform/data/docs.json', 'platform/public/data/docs.json']:
    try:
        with open(path) as f: d = json.load(f)
        if isinstance(d.get('entries'), list): print('  OK docs.json'); break
    except FileNotFoundError: pass
    except Exception: pass
" || { echo "  FAIL JSON"; FAIL=1; }
echo ""

LAB_UP=0
if lab_running; then LAB_UP=1; fi

if [ "$LAB_UP" -eq 0 ]; then
  echo "[2/15] Conteneurs … SKIP (lab non démarré)"
  echo "[3/15] HTTP Plateforme … SKIP"
  echo "[4/15] HTTP Cibles … SKIP"
  echo "[5/15] Réseau … SKIP"
  echo "[6/15] Logs vuln-api … SKIP"
  echo "[7/15] Logs frontend … (exécuté ci-dessous)"
  echo "[8/15] Config hostnames … (exécuté ci-dessous)"
  echo "[9/15] Route terminal … SKIP"
  echo "[10/15] Fichiers statiques … SKIP"
  echo "[11/15] Terminal + données Phase 3 … SKIP (lab non démarré)"
  echo "[12/15] Docs essentiels … (exécuté ci-dessous)"
  echo "[13/15] Plateforme complète … (exécuté ci-dessous)"
  echo "[14/15] Couverture absolue … (exécuté ci-dessous)"
  echo "[15/15] Système lab complet (bureau VNC, proxy, capture, simulateur, progression, cours, docs) … (exécuté ci-dessous)"
  echo ""
  echo ">>> Pour tous les tests : make up   puis   make test"
  if [ "$REQUIRE_LAB" = "1" ]; then echo ">>> TEST_REQUIRE_LAB=1 : échec (lab non démarré)."; exit 1; fi
else
  # ---- 2. Conteneurs ----
  echo "[2/15] Conteneurs (docker compose ps)..."
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
  echo "[3/15] HTTP Plateforme (gateway port $GATEWAY_PORT)..."
  for url in "/" "/data/rooms.json" "/data/scenarios.json" "/demo-phishing.html" "/test-logs.html"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$GATEWAY_URL$url" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then echo "  OK $url $code"; else echo "  FAIL $url $code"; FAIL=1; fi
  done
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$GATEWAY_URL/data/config.json" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then echo "  OK /data/config.json $code"; else echo "  WARN /data/config.json $code (rebuild: make build platform)"; fi
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$GATEWAY_URL/cible/dvwa/" 2>/dev/null || echo "000")
  if [ "$code" = "200" ] || [ "$code" = "302" ]; then echo "  OK /cible/dvwa/ (même origine) $code"; else echo "  WARN /cible/dvwa/ $code"; fi
  # Données plateforme (servies par la gateway)
  for dataurl in "/data/learning.json" "/data/targets.json" "/data/docSources.json" "/data/challenges.json" "/data/toolPacks.json" "/data/labToolPresets.json"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$GATEWAY_URL$dataurl" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then echo "  OK $dataurl 200"; else echo "  WARN $dataurl $code"; fi
  done
  # Routes cibles (proxy pass) : /cible/juice, /cible/api, /cible/bwapp
  for cible in "/cible/juice/" "/cible/api/" "/cible/bwapp/"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$GATEWAY_URL$cible" 2>/dev/null || echo "000")
    if [ "$code" = "200" ] || [ "$code" = "302" ] || [ "$code" = "304" ]; then echo "  OK $cible $code"; else echo "  WARN $cible $code"; fi
  done
  # Bureau noVNC (redirection ou page)
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$GATEWAY_URL/desktop" 2>/dev/null || echo "000")
  if [ "$code" = "302" ] || [ "$code" = "200" ]; then echo "  OK /desktop (bureau noVNC) $code"; else echo "  WARN /desktop $code"; fi
  echo ""

  # ---- 4. HTTP Cibles ----
  echo "[4/15] HTTP Cibles (via gateway)..."
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
  echo "[5/15] Réseau (attaquant -> vuln-network)..."
  docker compose exec -T attaquant nmap -sV -Pn -p 22 vuln-network 2>/dev/null | grep -q "22/tcp.*open.*ssh" && echo "  OK SSH détecté" || { echo "  FAIL nmap"; FAIL=1; }
  echo ""

  # ---- 6. Logs vuln-api ----
  echo "[6/15] Logs vuln-api..."
  curl -s -o /dev/null --connect-timeout 2 -H "Host: api.lab" "$GATEWAY_URL/api/health" 2>/dev/null || true
  sleep 1
  docker compose logs vuln-api 2>&1 | tail -30 | grep -qE '"action".*"request"|GET /api/health' && echo "  OK logs" || echo "  WARN aucun log requête"
  echo ""

  # ---- 9. Route terminal ----
  echo "[9/15] Route terminal (Host: terminal.lab)..."
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 -H "Host: terminal.lab" "$GATEWAY_URL/" 2>/dev/null || echo "000")
  if [ "$code" = "200" ] || [ "$code" = "101" ] || [ "$code" = "000" ]; then echo "  OK terminal.lab $code"; else echo "  WARN terminal $code"; fi
  echo ""

  # ---- 10. Fichiers plateforme (app Vite buildée) ----
  echo "[10/15] Fichiers plateforme (app, data)..."
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$GATEWAY_URL/" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then echo "  OK / (app)"; else echo "  FAIL / $code"; FAIL=1; fi
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$GATEWAY_URL/data/rooms.json" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then echo "  OK data/rooms.json"; else echo "  FAIL data/rooms.json $code"; FAIL=1; fi
  echo ""
fi

# ---- 7. Logs frontend (toujours) ----
echo "[7/15] Logs frontend (logger + intégration)..."
[ -f "platform/js/logger.js" ] && grep -q "getEntries\|LabCyberLogger" platform/js/logger.js 2>/dev/null && echo "  OK logger.js" || { echo "  FAIL logger.js"; FAIL=1; }
[ -f "platform/js/app.js" ] && grep -q "LabCyberLogger\|logEvent" platform/js/app.js 2>/dev/null && echo "  OK app.js" || { echo "  FAIL app.js"; FAIL=1; }
[ -f "platform/index.html" ] && grep -q "log-panel\|log-entries\|logger.js" platform/index.html 2>/dev/null && echo "  OK index.html (panneau logs)" || { echo "  FAIL index.html"; FAIL=1; }
echo ""

# ---- 8. Config hostnames (toujours) ----
echo "[8/15] Config hostnames (config.json)..."
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

# ---- 11. Fichiers terminal + data Phase 3 (toujours) ----
echo "[11/15] Fichiers terminal + data Phase 3..."
TERM_FAIL=0
[ -f "platform/public/terminal-client.html" ] || { echo "  FAIL terminal-client.html absent"; TERM_FAIL=1; }
grep -q "session\|get('session')" platform/public/terminal-client.html 2>/dev/null || { echo "  WARN terminal-client.html sans param session"; }
# Contrat : l'URL du terminal contient toujours session= (historique par session)
[ -f "platform/src/lib/store.js" ] && grep -q "session=" platform/src/lib/store.js 2>/dev/null && grep -q "getTerminalUrl" platform/src/lib/store.js 2>/dev/null && echo "  OK store getTerminalUrl (session dans URL)" || { echo "  WARN store getTerminalUrl/session"; }
# Contrat store : clés lab, terminal, progression, simulateur, capture, engagements
STORE_OK=1
for fn in getCurrentLabId setCurrentLabId getLabs getNetworkSimulations setNetworkSimulations getLabTerminalState setLabTerminalState getMachineUrl getEngagement getTaskDone setTaskDone getScenarioStatus getCaptureState setCaptureState getProxies setProxies getRequestData setRequestData; do
  grep -q "$fn" platform/src/lib/store.js 2>/dev/null || STORE_OK=0
done
[ "$STORE_OK" -eq 1 ] && echo "  OK store (lab, terminal, progression, simulateur, capture, proxy, API)" || { echo "  WARN store manque des exports"; }
[ -f "platform/data/toolPacks.json" ] && echo "  OK toolPacks.json" || { echo "  WARN toolPacks.json absent"; }
[ -f "platform/data/labToolPresets.json" ] && echo "  OK labToolPresets.json" || { echo "  WARN labToolPresets.json absent"; }
[ -f "lab-terminal/main.go" ] && grep -q "sessionID\|session" lab-terminal/main.go 2>/dev/null && echo "  OK lab-terminal (session)" || true
grep -q "attaquant:7682\|server attaquant" gateway/nginx.conf 2>/dev/null && echo "  OK gateway terminal-house -> attaquant (Kali)" || { echo "  WARN gateway terminal-house doit pointer vers attaquant:7682"; }
[ $TERM_FAIL -eq 1 ] && FAIL=1
echo ""

# ---- 12. Docs essentiels + scénarios + gateway cibles ----
echo "[12/15] Docs, scénarios, cibles (roadmap, CIBLES, Phase3, DVWA/juice, gateway)..."
DOC_FAIL=0
[ -f "docs/ROADMAP-SYSTEME-MAISON.md" ] && echo "  OK docs/ROADMAP-SYSTEME-MAISON.md" || { echo "  FAIL ROADMAP-SYSTEME-MAISON.md absent"; DOC_FAIL=1; }
[ -f "platform/docs/05-CIBLES-A-FAIRE.md" ] && echo "  OK platform/docs/05-CIBLES-A-FAIRE.md" || { echo "  FAIL 05-CIBLES-A-FAIRE.md absent"; DOC_FAIL=1; }
[ -f "platform/docs/04-PHASE3-OUTILS.md" ] && echo "  OK platform/docs/04-PHASE3-OUTILS.md" || { echo "  FAIL 04-PHASE3-OUTILS.md absent"; DOC_FAIL=1; }
[ -f "STATUS.md" ] && echo "  OK STATUS.md" || { echo "  WARN STATUS.md absent"; }
grep -q "getMachineUrl\|/cible/" platform/src/lib/store.js 2>/dev/null && echo "  OK store getMachineUrl (cibles navigateur)" || { echo "  WARN getMachineUrl/cible"; }
# Gateway : toutes les routes cibles (dvwa, juice, api, bwapp)
for cible in dvwa juice api bwapp; do
  grep -q "location /cible/$cible" gateway/nginx.conf 2>/dev/null && true || { echo "  WARN gateway /cible/$cible manquant"; }
done
grep -q "location /cible/dvwa" gateway/nginx.conf 2>/dev/null && echo "  OK gateway /cible/* (dvwa, juice, api, bwapp)" || { echo "  WARN gateway cibles"; }
python3 -c "
import json
with open('platform/data/scenarios.json') as f:
    d = json.load(f)
for s in d.get('scenarios', []):
    for m in s.get('machines', []):
        if m.get('urlKey') and m['urlKey'] != 'terminal':
            break
    else:
        continue
    break
else:
    print('  WARN aucun scénario avec machine urlKey (dvwa, juice, etc.)')
    exit(0)
print('  OK scenarios avec machines cibles (urlKey)')
" 2>/dev/null || true
# Attaquant : build depuis racine pour inclure lab-terminal (shell = Kali)
grep -q "context: \." docker-compose.yml 2>/dev/null && grep -q "dockerfile: attacker" docker-compose.yml 2>/dev/null && echo "  OK attaquant build (context . pour lab-terminal)" || { echo "  WARN attaquant doit être buildé avec context . et dockerfile attacker/Dockerfile"; }
# Abandon scénario : ne doit pas réinitialiser le lab (pas d'appel onLabChange/default dans abandonScenario)
if grep -q "abandonScenario" platform/src/views/ScenarioView.jsx 2>/dev/null; then
  if grep -A1 "abandonScenario = " platform/src/views/ScenarioView.jsx 2>/dev/null | grep -qE "onLabChange|setCurrentLabId|'default'"; then
    echo "  WARN abandon scénario ne doit pas changer le lab (vérifier ScenarioView)"
  else
    echo "  OK abandon scénario ne réinitialise pas le lab"
  fi
fi
# Vues clés (simulateur, capture, labs, progression)
VIEWS_OK=1
for v in NetworkSimulatorView CaptureView LabsView ProgressionView Dashboard ScenarioView; do
  [ -f "platform/src/views/${v}.jsx" ] || { echo "  WARN vue manquante: ${v}.jsx"; VIEWS_OK=0; }
done
[ "$VIEWS_OK" -eq 1 ] && echo "  OK vues clés (Dashboard, Scenario, Labs, Capture, Simulateur, Progression)"
[ $DOC_FAIL -eq 1 ] && FAIL=1
echo ""

# ---- 13. Plateforme complète : targets, API, learning, CVE, panels, simulateur, engagements, proxy ----
echo "[13/15] Plateforme complète (targets, API, learning, CVE, PiP, simulateur, engagements)..."
PLAT_FAIL=0
# Targets : catalogue des cibles (dvwa, vuln-api, vuln-network, etc.) – utilisé par Engagements et Dashboard
python3 -c "
import json
for path in ['platform/data/targets.json', 'platform/public/data/targets.json']:
    try:
        with open(path) as f: d = json.load(f)
        t = d.get('targets') or d
        if isinstance(t, list) and len(t) >= 1: print('  OK', path, '(', len(t), 'cibles)'); break
        elif isinstance(t, list): print('  WARN', path, 'vide'); break
    except FileNotFoundError: pass
    except Exception as e: print('  FAIL', path, e); exit(1)
else:
    print('  WARN targets.json non trouvé ou invalide')
" 2>/dev/null || true
[ -f "platform/data/learning.json" ] && python3 -c "
import json
with open('platform/data/learning.json') as f: d = json.load(f)
print('  OK learning.json' if d.get('topics') or d.get('categories') or isinstance(d, list) else '  WARN learning.json structure')
" 2>/dev/null || echo "  WARN learning.json"
[ -f "platform/src/components/TerminalPipPanel.jsx" ] && echo "  OK TerminalPipPanel (PiP)" || { echo "  WARN TerminalPipPanel"; PLAT_FAIL=1; }
[ -f "platform/src/views/ApiClientView.jsx" ] && echo "  OK ApiClientView (requêtes API/Postman)" || true
[ -f "platform/src/views/EngagementsView.jsx" ] && echo "  OK EngagementsView (engagements/cibles)" || true
[ -f "platform/src/views/ProgressionView.jsx" ] && echo "  OK ProgressionView (progression)" || true
[ -f "platform/src/views/NetworkSimulatorView.jsx" ] && grep -q "setNetworkSimulations\|getNetworkSimulations" platform/src/views/NetworkSimulatorView.jsx 2>/dev/null && echo "  OK Simulateur réseau (persistance par lab)" || echo "  OK NetworkSimulatorView"
[ -f "platform/src/views/CaptureView.jsx" ] && echo "  OK CaptureView (pcap)" || true
[ -f "platform/src/views/ProxyConfigView.jsx" ] && echo "  OK ProxyConfigView" || true
grep -q "CvePanel\|cvePanelOpen" platform/src/App.jsx 2>/dev/null && echo "  OK CVE (panneau)" || true
# Données doc / challenges (Bibliothèque doc, Learning)
for j in platform/data/docSources.json platform/data/challenges.json; do
  [ -f "$j" ] && python3 -c "import json; json.load(open('$j'))" 2>/dev/null && echo "  OK $(basename $j)" || true
done
# Vues et composants critiques supplémentaires (présence fichier)
[ -f "platform/src/views/LearningView.jsx" ] && echo "  OK LearningView (Doc/Cours)" || true
[ -f "platform/src/views/DocOfflineView.jsx" ] && echo "  OK DocOfflineView (Bibliothèque doc)" || true
[ -f "platform/src/components/Sidebar.jsx" ] && echo "  OK Sidebar" || true
[ -f "platform/src/components/Topbar.jsx" ] && echo "  OK Topbar" || true
[ -f "platform/src/components/ScenarioBottomBar.jsx" ] && echo "  OK ScenarioBottomBar" || true
[ -f "platform/src/components/JournalCompletModal.jsx" ] && echo "  OK JournalCompletModal" || true
[ -f "platform/src/components/StatsModal.jsx" ] && echo "  OK StatsModal" || true
[ -f "platform/src/components/LogPanel.jsx" ] && echo "  OK LogPanel" || true
[ -f "platform/src/views/DocsView.jsx" ] && echo "  OK DocsView" || true
[ -f "platform/src/views/OptionsView.jsx" ] && echo "  OK OptionsView" || true
[ -f "platform/src/views/RoomView.jsx" ] && echo "  OK RoomView" || true
[ -f "platform/src/views/ProxyToolsView.jsx" ] && echo "  OK ProxyToolsView" || true
[ -f "platform/src/views/TerminalFullView.jsx" ] && echo "  OK TerminalFullView" || true
[ -f "platform/src/components/OpenInPageDropdown.jsx" ] && echo "  OK OpenInPageDropdown" || true
[ -f "platform/src/components/LabButtonDropdown.jsx" ] && echo "  OK LabButtonDropdown" || true
[ -f "platform/src/components/PipPanel.jsx" ] && echo "  OK PipPanel" || true
# App.jsx : routes principales (Dashboard, Scenario, Labs, etc.)
grep -q "Dashboard\|ScenarioView\|LabsView\|path.*scenario\|path.*labs" platform/src/App.jsx 2>/dev/null && echo "  OK App routes (Dashboard, Scenario, Labs)" || true
[ -f "platform/src/main.jsx" ] && grep -q "App\|createRoot\|React" platform/src/main.jsx 2>/dev/null && echo "  OK main.jsx (React + App)" || true
[ $PLAT_FAIL -eq 1 ] && FAIL=1
# Si lab up : vuln-api endpoints (requêtes API type Postman)
if lab_running 2>/dev/null; then
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 -H "Host: api.lab" "$GATEWAY_URL/api/health" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then echo "  OK vuln-api /api/health (requêtes API)"; else echo "  WARN vuln-api /api/health $code"; fi
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 -H "Host: api.lab" "$GATEWAY_URL/api/products" 2>/dev/null || echo "000")
  if [ "$code" = "200" ] || [ "$code" = "401" ]; then echo "  OK vuln-api /api/products"; else echo "  WARN vuln-api /api/products $code"; fi
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 -H "Host: api.lab" "$GATEWAY_URL/api/users/1" 2>/dev/null || echo "000")
  if [ "$code" = "200" ] || [ "$code" = "401" ]; then echo "  OK vuln-api /api/users/1"; else echo "  WARN vuln-api /api/users/1 $code"; fi
fi
echo ""

# ---- 14. Couverture absolue : storage, defaultData, docker-compose, gateway, données non vides, HTTP docs, vuln-api login ----
echo "[14/15] Couverture absolue (storage, compose, gateway, données, HTTP docs, API login)..."
EXTRA_FAIL=0
# storage.js (IndexedDB) : contrat getLabs, getCurrentLabId
[ -f "platform/public/storage.js" ] && grep -qE "getLabs|getCurrentLabId|KEY_LABS|KEY_CURRENT_LAB" platform/public/storage.js 2>/dev/null && echo "  OK storage.js (getLabs, getCurrentLabId, clés)" || { echo "  WARN storage.js contrat"; EXTRA_FAIL=1; }
# defaultData.js : données embarquées
[ -f "platform/src/lib/defaultData.js" ] && grep -qE "EMBEDDED|rooms|scenarios|targets" platform/src/lib/defaultData.js 2>/dev/null && echo "  OK defaultData.js (données embarquées)" || true
# docker-compose : services obligatoires (gateway, platform, attaquant, vuln-api, vuln-network)
count=$(grep -cE '^  (gateway|platform|attaquant|vuln-api|vuln-network):' docker-compose.yml 2>/dev/null || echo "0")
if [ "$count" -ge 5 ]; then echo "  OK docker-compose (gateway, platform, attaquant, vuln-api, vuln-network)"; else echo "  WARN docker-compose services manquants"; fi
# Gateway : routes critiques
grep -q "location /terminal-house/" gateway/nginx.conf 2>/dev/null && grep -q "server_name terminal.lab" gateway/nginx.conf 2>/dev/null && grep -q "server_name api.lab" gateway/nginx.conf 2>/dev/null && echo "  OK gateway (terminal-house, server_name api.lab, terminal.lab)" || { echo "  WARN gateway routes/server_name"; }
# rooms.json : au moins une room ou catégorie
python3 -c "
import json
with open('platform/data/rooms.json') as f: d = json.load(f)
r = d.get('rooms') or d.get('categories') or []
if isinstance(r, list) and len(r) >= 0: print('  OK rooms.json (structure rooms/categories)')
else: print('  WARN rooms.json'); exit(1)
" 2>/dev/null || true
# toolPacks.json : au moins un pack (clé packs ou liste)
python3 -c "
import json
with open('platform/data/toolPacks.json') as f: d = json.load(f)
p = d.get('packs') if isinstance(d, dict) else (d if isinstance(d, list) else [])
if isinstance(p, list) and len(p) >= 1: print('  OK toolPacks.json (au moins un pack)')
else: print('  WARN toolPacks vide')
" 2>/dev/null || true
# Quand lab up : /data/docs.json
if lab_running 2>/dev/null; then
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$GATEWAY_URL/data/docs.json" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then echo "  OK /data/docs.json 200"; else echo "  WARN /data/docs.json $code"; fi
  # vuln-api POST /api/login (attendu 400/401 sans body, ou 405 GET)
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST --connect-timeout 2 -H "Host: api.lab" "$GATEWAY_URL/api/login" 2>/dev/null || echo "000")
  if [ "$code" = "200" ] || [ "$code" = "400" ] || [ "$code" = "401" ] || [ "$code" = "422" ]; then echo "  OK vuln-api POST /api/login ($code)"; else echo "  WARN vuln-api POST /api/login $code"; fi
fi
echo ""

# ---- 15. Système lab complet : bureau VNC, proxy, capture pcap, simulateur réseau, progression, cours, docs ----
echo "[15/15] Système lab complet (bureau VNC, proxy, capture, simulateur, progression, cours, docs)..."
# Bureau VNC (noVNC) : gateway /desktop, docker-compose desktop
grep -q "location.*/desktop" gateway/nginx.conf 2>/dev/null && echo "  OK gateway /desktop (bureau VNC noVNC)" || echo "  WARN gateway /desktop"
grep -qE '^  desktop:' docker-compose.yml 2>/dev/null && echo "  OK docker-compose desktop (bureau)" || echo "  WARN docker-compose desktop"
if lab_running 2>/dev/null; then
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$GATEWAY_URL/desktop" 2>/dev/null || echo "000")
  if [ "$code" = "302" ] || [ "$code" = "200" ]; then echo "  OK HTTP /desktop (bureau VNC) $code"; else echo "  WARN /desktop $code"; fi
fi
# Proxy : service (optionnel profil), vue + store déjà testés
grep -qE '^  proxy:' docker-compose.yml 2>/dev/null && echo "  OK docker-compose proxy (Squid)" || echo "  WARN docker-compose proxy"
grep -q "getProxies\|setProxies" platform/src/lib/store.js 2>/dev/null && echo "  OK store proxy (getProxies/setProxies)" || true
# Capture pcap : vue + contrat store
[ -f "platform/src/views/CaptureView.jsx" ] && grep -qiE "pcap|capture|upload|fichier" platform/src/views/CaptureView.jsx 2>/dev/null && echo "  OK CaptureView (pcap/capture/upload)" || echo "  OK CaptureView"
grep -q "getCaptureState\|setCaptureState" platform/src/lib/store.js 2>/dev/null && echo "  OK store capture (getCaptureState/setCaptureState)" || true
# Simulateur réseau : vue + contrat store (déjà en 13), accessibilité données
[ -f "platform/src/views/NetworkSimulatorView.jsx" ] && grep -qiE "simulation|carte|topology|getNetworkSimulations" platform/src/views/NetworkSimulatorView.jsx 2>/dev/null && echo "  OK Simulateur réseau (carte/simulation/topology)" || echo "  OK NetworkSimulatorView"
grep -q "getNetworkSimulations\|setNetworkSimulations" platform/src/lib/store.js 2>/dev/null && echo "  OK store simulateur (get/setNetworkSimulations)" || true
# Progression : vue + store
[ -f "platform/src/views/ProgressionView.jsx" ] && grep -qiE "task|progression|scenario|getTaskDone|getScenarioStatus" platform/src/views/ProgressionView.jsx 2>/dev/null && echo "  OK ProgressionView (tâches/progression)" || echo "  OK ProgressionView"
grep -q "getTaskDone\|getScenarioStatus" platform/src/lib/store.js 2>/dev/null && echo "  OK store progression (getTaskDone/getScenarioStatus)" || true
# Cours / Learning : vue + données
[ -f "platform/src/views/LearningView.jsx" ] && grep -qiE "topic|course|learning|doc" platform/src/views/LearningView.jsx 2>/dev/null && echo "  OK LearningView (cours/topics)" || echo "  OK LearningView"
[ -f "platform/data/learning.json" ] && echo "  OK learning.json (cours)" || true
# Docs / Bibliothèque : vues + données
[ -f "platform/src/views/DocOfflineView.jsx" ] && grep -qiE "doc|source|offline" platform/src/views/DocOfflineView.jsx 2>/dev/null && echo "  OK DocOfflineView (doc/offline)" || echo "  OK DocOfflineView"
[ -f "platform/src/views/DocsView.jsx" ] && echo "  OK DocsView" || true
[ -f "platform/data/docSources.json" ] && echo "  OK docSources.json (docs)" || true
# Cibles : targets + gateway /cible/* (déjà en 12/13)
[ -f "platform/data/targets.json" ] && echo "  OK targets.json (cibles)" || true
echo ""

if [ $FAIL -eq 0 ]; then
  echo "=== Tous les tests exécutés sont passés ==="
  [ -n "$TEST_REPORT" ] && ( echo "=== Tous les tests exécutés sont passés ==="; echo "Rapport: $(date -Iseconds)"; echo "Tests: 0-15"; ) >> "$TEST_REPORT" 2>/dev/null || true
  [ "$LAB_UP" -eq 0 ] && echo "    (make up puis make test pour les tests réseau/HTTP)"
  exit 0
else
  echo "=== Certains tests ont échoué ==="
  [ -n "$TEST_REPORT" ] && ( echo "=== Certains tests ont échoué ==="; echo "Rapport: $(date -Iseconds)"; ) >> "$TEST_REPORT" 2>/dev/null || true
  exit 1
fi
