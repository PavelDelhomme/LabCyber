# État du projet Lab Cyber

Ce fichier liste ce qui reste à faire en priorité, puis les améliorations, et en fin la liste des éléments déjà réalisés.

---

## 🚨 PRIORITÉ (à traiter en priorité)

*Uniquement ce qui reste à faire. Les points déjà corrigés sont listés en bas dans « Réalisé ».*

**Scintillement** : pour le moment plus de scintillement signalé (à surveiller). Si ça revient, désactiver `contain`/`translateZ(0)` et vérifier avec React DevTools Profiler.

### Terminal web attaquant (panneau et PiP)

- **Commande `exit` → fermer l’onglet** : **implémenté** (app + backend). Côté app : écoute de `postMessage` `{ type: 'lab-cyber-terminal-exit' }` et fermeture de l’onglet courant (panneau ou PiP) ; le handler ne réagit que si le message vient d’un iframe du panneau (ou du PiP pour le PiP). Côté backend : la gateway (nginx) injecte un script **avant la première balise `<script>`** dans la page ttyd ; ce script enveloppe `WebSocket` et envoie le message à la page parente **avant** le handler ttyd (pour que l’onglet se ferme avant toute tentative de reconnexion / refreshToken). Voir `gateway/nginx.conf` (location `/terminal/`, `sub_filter`). **Test** : après modification de la gateway, `make dev` ou rebuild gateway puis redémarrer ; recharger la page du lab (ou ouvrir le terminal en panneau/PiP) puis taper `exit` → l’onglet doit se fermer. **Vérifier l’injection** : avec le lab démarré, lancer `make terminal-html` ; le résultat s’affiche dans le terminal (« Injection exit : OK » ou « ABSENTE »), sans fichier à ouvrir.
- **Panneau – historique conservé** : le panneau n’est plus démonté à la fermeture ; il reste en DOM (masqué en CSS). Les iframes sont rendues une par onglet (pas seulement l’onglet actif), donc l’état et l’historique de chaque session sont conservés quand on ferme puis rouvre le panneau.
- **PiP – plus de rechargement sur commandes** : l’URL de l’iframe PiP n’est plus mise à jour à chaque rendu ; elle est définie une seule fois au montage (`StableTerminalIframe`), ce qui évite le rechargement intempestif (ex. après `ls`) et la perte de l’affichage.
- Bouton « + » nouvel onglet terminal : corriger si besoin (stopPropagation, persistance).

**Ce qui est enregistré côté app**  
- Liste des onglets (noms, nombre), onglet actif, largeur du panneau, etc. : sauvegardé dans le storage (session UI) et restauré au rechargement de la page.  
- Chaque onglet a une URL distincte `?session=<tabId>` pour que le backend puisse associer une session par onglet (à implémenter côté ttyd/gateway si pas déjà fait).  
- **Journal de session** (historique enregistré) : les lignes ajoutées manuellement (commandes ou notes) sont persistées en storage et restent après rechargement.

**Limites connues (pas encore complètement opérationnel)**  
1. **Connexions WebSocket qui se rouvrent** : en changeant d’onglet terminal, l’historique affiché dans le terminal (scrollback ttyd) peut se réinitialiser car le navigateur peut suspendre les iframes non visibles et couper le WebSocket. **Correction partielle** : les onglets inactifs utilisent `visibility: hidden` au lieu de `display: none` pour limiter la suspension des iframes. Pour un comportement totalement stable, le backend doit gérer `?session=<tabId>` (une session ttyd par onglet, éventuellement persistée).  
2. **Rechargement de la page ou autre navigateur** : on **perd le contenu des sessions** (shell, scrollback). Seuls sont restaurés : la liste des onglets (noms, nombre), l’onglet actif, le journal de session (lignes enregistrées à la main). Les iframes sont rechargées donc nouvelles connexions ttyd = nouveaux shells. Pour ne pas perdre au rechargement, il faudrait une **persistance côté serveur** (ttyd ou gateway) : associer une session à un id, la restaurer au reload (hors scope actuel).  
3. **Exit** : implémenté (script injecté par la gateway ; à la fermeture du WebSocket, la page envoie `postMessage` et l’app ferme l’onglet).

**Diagnostic panneau terminal (corrections déjà appliquées)**  
1. **Historique perdu** : le body du panneau (et donc toutes les iframes) était rendu seulement quand `!terminalPanelMinimized`. Dès qu’on réduisait puis agrandissait, tout était démonté puis remonté → nouvelles iframes, plus d’historique. **Correction** : le body est toujours rendu ; en mode réduit il est caché en CSS ; les iframes restent en DOM.  
2. **Clic sur un autre onglet** : chaque onglet a une URL avec `?session=<tabId>`. Onglets inactifs en `visibility: hidden` (au lieu de `display: none`) pour limiter la coupure WebSocket.  
3. **Exit** : la gateway injecte un script dans la page ttyd qui envoie `postMessage({ type: 'lab-cyber-terminal-exit' })` à la fermeture du WebSocket ; l’app ferme alors l’onglet.

### Panneaux et lab

- **Panneau terminal rétracté** : marge à droite pour que Options, Stats, Journal, CVE restent visibles et cliquables.
- **Lab actif – Ouvrir en panneau** : Simulateur, Proxy, Requêtes API, Capture en panneau ; onglets horizontaux (Terminal, Capture, Doc).
- **Session par lab** : panneaux ouverts enregistrés par lab.

### Simulateur réseau (à faire correctement – beaucoup manquant)

- **Persistance des cartes** (super important) : quand on crée une nouvelle carte puis on revient sur l’ancienne, **on perd le contenu** de l’ancienne carte. Persister la carte courante avant de changer d’onglet et charger correctement au retour.
- **Nouvelle carte** : pouvoir personnaliser (nom, contexte) dès la création.
- **Design** : le **titre/nom** de l’appareil (ex. « PC ») est **décalé** par rapport au centre du bloc ; ajouter des **éléments visuels minimal** pour distinguer routeur, PC, switch, serveur (icônes ou formes spécifiques).
- **Types d’appareils** : pas seulement PC, Routeur, Switch, Serveur — ajouter **téléphone**, **tablette**, **firewall**, **AP WiFi**, **cloud**, etc. pour un ensemble complet type Packet Tracer.
- **Types de liaisons** : étendre au-delà d’Ethernet/Console/Fibre — **WiFi**, **données mobiles**, **RJ12**, etc. pour modéliser des liens réalistes.
- **Carte et lab par défaut** : une **carte par défaut** avec au moins la **machine Kali (attaquant)** connectée, pour tester les intrusions dans les systèmes virtuels créés ; contexte « lab actuel » ou lab choisi, connecté au simulateur.
- **Routeur / équipements** : pouvoir définir **modèle** (ex. Cisco, type) ; options plus poussées (config routeur/switch) : **interface minimal type terminal** pour configurer le routeur/PC (CLI simulée ou lien vers terminal).
- **Capture pcap** : pouvoir indiquer que la capture s’exécute **dans le lab actuel** ou dans un lab donné ; lien clair simulateur ↔ lab ↔ capture.
- **Scénarios à ajouter plus tard** : scénarios **SIP** et **téléphonie** (VoIP, etc.) en plus des scénarios existants.

### CVE, formulaire, capture, autre

- **CVE** : flux recherche → résultats clair ; plus tard : afficher par ID dans le panel, enregistrer les CVE (par lab).
- **Champs formulaire** : compléter `id`/`name` partout (autofill).
- **Redimensionnement panneau terminal** : poignée et listeners.
- **Panneau capture** : toggle et persistance (parfois ne s’affiche pas au premier clic).

---

## 🔲 À faire / à améliorer

### Application

1. **Terminal / bureau**  
   - Terminal = lab par défaut ; si lab actif : proposer **terminal lab actif** ou **lab par défaut**.  
   - **Historique / session terminal** : pouvoir enregistrer l’**état historique** du terminal (attaquant, lab, etc.), prendre des **notes par ligne/session**, et option pour **nettoyer** cet historique. Persistance des sessions/onglets et de l’historique des commandes si possible.

2. **Système de panneaux (côté droit)**  
   - Multi-panneaux avec onglets (Terminal, Capture, Doc, Simulateur, Proxy, API). Menu Ouvrir, barre d’icônes des panneaux actifs. Simulateur en panneau avec carte par défaut / lab.

3. **Lab actif – Ouvrir en panneau**  
   - Dans le popup Lab, « Ouvrir dans la page » doit **toujours** ouvrir en **panneau** (terminal, capture, simulateur, proxy, API), jamais en changeant la page courante ni en nouvel onglet.

4. **Terminal PiP**  
   - Déplaçable validé, plusieurs onglets. PiP : plus de rechargement sur commandes (URL iframe fixée au montage). Exit → fermer l’onglet si le backend envoie `postMessage` (voir PRIORITÉ). Persistance des onglets en session si besoin.

5. **CVE**  
   - Recherche : résultats dans le panel (déjà en place). À améliorer : affichage par ID dans le panel ; **enregistrer les CVE détectés** (par lab ou global) pour les consulter plus tard.

6. **Capture pcap – analyse côté client (machine du navigateur)**  
   - **À faire** : analyse complète du trafic de la **machine client** (où tourne le navigateur) : cartes réseau, WiFi, etc. — pas côté serveur/lab. **Contrainte** : le navigateur ne peut pas capturer en direct les interfaces (sécurité). Pistes : **(A)** Capturer sur son PC avec Wireshark/tcpdump/npcap, puis charger le .pcap ici (déjà possible). **(B)** À prévoir : agent/script local (npcap/libpcap) sur le client qui capture et produit un .pcap. — Déjà en panneau ou en page. S’assurer que depuis le lab actif on peut tout ouvrir en panneau.

7. **Panneau scénario (barre en bas)**  
   - Afficher l’**avancement** des tâches (fait / en cours / pas commencé), revoir le design (pas décalé à droite).

8. **Autres**  
   - Terminal : redimensionnement, réduction, persistance onglets.  
   - Capture : décodage avancé, Wireshark-like ; **analyse complète client** (voir point 6 ci-dessus).  
   - Cours pentest, vuln-network/vuln-api, doc projet, sync doc, tests, etc. (voir ancienne section « À faire » pour le détail).

### Doc & Cours / Bibliothèque doc

- **Panneau Doc** : ajouter un panneau droit « Doc & Cours » (ou onglet dans un panneau unifié) pour rechercher et lire les docs/cours sans quitter la page (comme le terminal en panneau).
- **PDF** : si une documentation récupérée est un PDF, la gérer correctement (affichage ou lien de téléchargement) dans la Bibliothèque doc.
- Sync doc automatique (déjà en place). Tests, doc & cours à compléter, données dynamiques.

### Scénarios à ajouter plus tard

- Scénarios **SIP** et **téléphonie** (VoIP, IP téléphony, etc.) en plus des scénarios actuels.

### Infrastructure / contenu

- Outils à documenter – voir structure détaillée ci-dessous si besoin.

---

## ⚠️ À vérifier en détail

- Panneau terminal : redimensionnement, réduction, onglets, persistance.  
- Panneau capture : ouverture, fermeture, persistance.  
- Tout ce qui touche aux panneaux et à l’UI : tester en conditions réelles.

---

## 📌 Problèmes signalés (résumés)

- Panneau terminal rétracté cache les boutons topbar/FAB → marge droite à faire.  
- Terminal PiP : déplaçable et onglets implémentés → à valider en test.  
- Bouton + nouvel onglet terminal → à valider / corriger si besoin.  
- Lab actif : Capture / Simulateur en panneau (système de panneaux) → à faire.  
- Voir PRIORITÉ et À faire ci-dessus pour le détail.

---

## Où modifier quoi

| Élément              | Emplacement principal        |
|----------------------|------------------------------|
| Documentation        | `platform/docs/`             |
| Catalogue doc hors ligne | `platform/data/docSources.json` |
| Données app          | `platform/data/` (JSON)      |
| Code app             | `platform/src/`              |
| Doc servie           | Copie dans `platform/public/docs/` (et dans `dist/docs/` au build) |
| Cache doc hors ligne | IndexedDB, clé `offlineDocs` (storage.js) |

---

## ✅ Réalisé (référence – à la fin pour ne pas surcharger le focus)

*Ce qui a été corrigé ou livré (à valider en test si pas encore fait).*

- **docModal** : variable définie dans `LearningView.jsx`, modale détail doc/cours au clic.
- **Popup lab bloquée** : touche **Escape** ferme le popup lab et les autres overlays (Stats, Journal, CVE, Options).
- **Lab actif – terminal** : ouverture du terminal en panneau depuis le popup lab ne referme plus le popup immédiatement (persistance via ref).
- **Journal + Stats** : un seul bouton dropdown (📋 ▼) avec Journal d’activité et Stats.
- **Panneau terminal** : en place (iframe, onglets, journal). Panneau gardé en DOM quand fermé (masqué en CSS) + une iframe par onglet → historique conservé à la fermeture/réouverture. Onglets inactifs en `visibility: hidden` (pas `display: none`) pour limiter la reconnexion WebSocket au changement d’onglet. Chaque onglet enregistré (liste, noms) en storage, URL `?session=<tabId>`. Bouton Recharger. Exit → fermeture de l’onglet si le backend envoie `postMessage`. Limite : rechargement page ou autre navigateur = perte du contenu des sessions (shell), seule la liste des onglets et le journal restent.
- **Terminal PiP** : déplaçable (validé), plusieurs onglets. Iframe avec URL fixée au montage → plus de rechargement (ex. après `ls`). Historique conservé tant que la fenêtre PiP reste ouverte. Exit → fermeture de l’onglet si le backend envoie `postMessage`.
- **Doc & Cours** : sous-navigation (sidebar thèmes + Doc / Cours / Outils), OWASP Top 10:2021 (catalogue + bloc Learning avec Ouvrir dans l’app / externe).
- **Bibliothèque doc** : isolation du design (`.doc-offline-content-isolated`) pour le HTML récupéré.
- **Capture pcap** : colonnes type Wireshark, filtre, détail ; notice « analyse machine client » (charger .pcap capturé sur son PC).
- Notes par lab, CVE (recherche NVD en app), terminal-full, doc `platform/docs/`, nmap (cap_add), iframe terminal, notes structurées, menu Ouvrir, Lab dropdown, actions flottantes, Options en page, Make help / restart-clean.

---

*Dernière mise à jour : février 2026.*
