# Roadmap – Système maison Lab Cyber

Ce document décrit la vision et le plan pour **remplacer les briques externes** (ttyd, Kali, éventuellement noVNC) par un **système maison** : terminal web + environnement de lab minimal, performant et entièrement maîtrisé.

---

## Objectifs

1. **Terminal panel qui fonctionne vraiment** : affichage PTY en temps réel, saisie, resize, exit → fermeture d’onglet, sans dépendre au comportement de ttyd.
2. **Environnement de lab dédié** : pas « un Kali générique », mais un **environnement minimal** par lab, avec **outils pré-sélectionnés** à la création du lab (nmap, curl, scripts, etc.).
3. **Performance et contrôle** : backend léger (C, C++ ou Go), pas de couches inutiles ; protocole WebSocket simple et documenté.
4. **Optionnel – « Bureau » sans VNC** : si on veut une interface type bureau (navigation web, notes, etc.), la faire **en pur web** (SPA, onglets, éditeur, liens) plutôt qu’un vrai bureau graphique (noVNC). Ultra léger, optimisé pour le lab.

---

## État actuel (à remplacer / compléter)

| Composant | Actuel | Problème / limite |
|-----------|--------|--------------------|
| Terminal web | ttyd (C + libwebsockets) + iframe client (xterm.js) | Client maison (`terminal-client.html`) corrigé pour le protocole binaire ttyd ; sinon dépendance à l’injection nginx, exit pas fiable. |
| Environnement exécution | Conteneur Kali (attaquant) | Lourd, générique ; pas de « lab spécifique » avec outils choisis. |
| Bureau / GUI | noVNC + XFCE (lab-desktop) | Lourd ; utile surtout pour « voir un bureau » ; on peut viser un équivalent 100 % web (onglets, notes, liens). |

---

## Architecture cible – Système maison

### 1. Backend « Lab Terminal » (nouveau service)

- **Rôle** : exposer un **PTY** (pseudo-terminal) sur **WebSocket** ; exécuter un **shell** (ou un environnement minimal) dans un conteneur ou une VM légère.
- **Stack proposée** : **Go** (bon compromis perf / rapidité de dev, stdlib net, crypto, facile à déployer en binaire) ou **C** (max perf, plus long à maintenir). C++ possible.
- **Fonctionnalités** :
  - Écoute HTTP/WebSocket (ou derrière la gateway existante).
  - Protocole simple : **texte ou binaire** (type + payload), ex. `0` = output PTY, `1` = input clavier, `2` = resize (rows/cols).
  - Un processus PTY par session (ou par lab) ; option « session id » pour multi-onglets.
  - À la fermeture du WebSocket (ex. `exit` dans le shell) : pas de reconnexion auto ; le client envoie `postMessage` → l’app ferme l’onglet (déjà en place côté front).
- **Environnement exécuté** : au choix
  - **Option A** : image Docker **minimale** (Alpine + shell + paquets définis par config du lab), pas Kali.
  - **Option B** : **« micro-OS »** ou script d’init qui installe uniquement les outils listés dans la config du lab (fichier ou API).

### 2. Client terminal web (déjà en place, à garder)

- **Fichier** : `platform/public/terminal-client.html`.
- **Rôle** : xterm.js + WebSocket vers le **nouveau** backend (ou temporairement vers ttyd avec protocole binaire corrigé).
- **Comportement** : token/session si besoin ; envoi input en binaire (type 0x30 + data) ; réception output (type 0 + data) ; resize (type 0x31 + JSON) ; à la fermeture WS → `postMessage('lab-cyber-terminal-exit')` pour fermer l’onglet.

### 3. Environnement « lab » (packs d’outils)

- **Idée** : chaque **lab** (ou type de lab) a une **liste d’outils** (nmap, hydra, curl, python3, scripts custom, etc.).
- **À la création du lab** (ou au build d’image) : installer uniquement ces outils (Dockerfile ou script Ansible/Packer).
- **Stockage** : config JSON (ex. `platform/data/labs.json` ou par scénario) avec `tools: ["nmap", "curl", ...]` ; le backend ou le script de build lit cette config et prépare l’image/container.

### 4. « Bureau » / interface étendue (optionnel, sans VNC)

- **Besoin** : navigation web, notes, liens, sans lancer un vrai bureau graphique (XFCE + noVNC).
- **Solution cible** : **interface 100 % web** dans la plateforme existante :
  - Onglets « Notes », « Liens », « Doc » (déjà en partie là).
  - Intégration d’un **navigateur simplifié** (iframe vers des URLs autorisées) ou liste de liens utiles pour le lab.
  - Pas de VNC ni X11 ; tout dans le navigateur de l’utilisateur.

---

## Plan de mise en œuvre (ordre proposé)

### Phase 1 – Terminal panel fiable (court terme)

- [x] **Client** : protocole binaire ttyd dans `terminal-client.html` (input 0x30, output 0, resize 0x31) — **fait**.
- [ ] **Vérifier** : en conditions réelles (make up, panneau terminal), affichage + saisie + resize + exit → fermeture onglet.
- [ ] Si ttyd reste insatisfaisant : démarrer un **proof-of-concept backend Go** (PTY + WebSocket, même protocole que le client) et faire pointer le client vers ce service.

### Phase 2 – Backend terminal maison (moyen terme)

- [ ] **Service** : binaire Go (ou C) qui :
  - Écoute un port (ou un socket) pour WebSocket.
  - Pour chaque connexion : crée un PTY, lance un shell (ex. `/bin/sh` ou bash), relaie stdin/stdout + resize.
  - Protocole : compatible avec le client actuel (octet type + payload) ou version simplifiée (texte pur si on préfère).
- [ ] **Intégration** : nouveau conteneur Docker « lab-terminal » (ou intégré dans un conteneur existant) ; la gateway route `/terminal/` vers ce service au lieu de ttyd.
- [ ] **Session / token** : optionnel ; soit une session par connexion WS, soit token pour associer à un lab/utilisateur.

### Phase 3 – Environnement lab dédié (moyen / long terme)

- [ ] **Config « outils par lab »** : format (JSON ou autre) listant les paquets/scripts par lab ou par scénario.
- [ ] **Image ou script** : build d’une image Docker minimale (Alpine/Debian slim) qui n’installe que ces outils ; ou script d’init dans un conteneur existant.
- [ ] **Backend terminal** : lancer le shell dans ce conteneur « lab » au lieu d’un Kali générique.

### Phase 4 – « Bureau » web (optionnel, sans VNC)

- [ ] Définir les besoins précis : navigation web (quelles URLs), notes, captures, etc.
- [ ] Étendre la plateforme (onglets, iframes, éditeur de notes) pour couvrir ces cas sans noVNC.
- [ ] Documenter la dépréciation possible de lab-desktop (noVNC) si tout est remplacé par le web.

---

## Choix techniques à trancher

| Sujet | Options | Recommandation courte |
|-------|---------|------------------------|
| Langage backend | C, C++, Go | **Go** : perf correcte, déploiement simple, stdlib PTY/WebSocket. C si besoin perf maximale. |
| Protocole WebSocket | Texte (JSON) vs binaire (octet + payload) | **Binaire** : déjà utilisé par le client, peu de parsing, faible overhead. |
| Environnement d’exécution | Docker (Alpine + outils), VM, bare metal | **Docker** : cohérent avec le lab actuel ; image par type de lab possible. |
| Bureau / GUI | Garder noVNC, ou tout en web | **Tout en web** : pas de VNC pour un « bureau lab » ; onglets, notes, liens dans la SPA. |

---

## Fichiers et docs à mettre à jour

- **STATUS.md** : section « Terminal » + nouvelle section « Système maison (roadmap) » avec lien vers ce fichier.
- **README.md** : mentionner la roadmap et le fait que le terminal peut évoluer vers un backend maison.
- **platform/docs/** : décrire le protocole WebSocket du terminal (octets de commande, format resize) pour les contributeurs.
- **docker-compose** : quand le nouveau service existera, ajouter le conteneur et la route gateway.

---

## Résumé

- **Court terme** : le client `terminal-client.html` parle correctement le protocole binaire ttyd → le terminal panel doit afficher et réagir. Si ce n’est pas suffisant, on enchaîne sur un PoC backend Go.
- **Moyen terme** : backend terminal maison (Go) + environnement par lab (packs d’outils, image Docker dédiée).
- **Long terme** : « bureau » lab 100 % web (notes, liens, navigation) sans VNC ; système lab entièrement maîtrisé et optimisé.

Ce document sera mis à jour au fur et à mesure de l’avancement (phases cochées, décisions techniques, nouveaux fichiers).
