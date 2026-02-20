# État du projet Lab Cyber

Ce fichier liste ce qui reste à faire en priorité, puis les améliorations, et en fin la liste des éléments déjà réalisés.

---

## 🚨 PRIORITÉ (à traiter en priorité)

*Uniquement ce qui reste à faire. Les points déjà corrigés sont listés en bas dans « Réalisé ».*

### Système maison (terminal + environnement lab)

**Vision** : **système maison** complet – voir [docs/ROADMAP-SYSTEME-MAISON.md](docs/ROADMAP-SYSTEME-MAISON.md). En résumé :
- **Conteneur attaquant** : autant d’outils que Kali (voire plus, ex. Black Arch) + **sélection de packs** + **outils de base** + **prédéfinitions à la création du lab** (outils nécessaires au lab/scénario).
- **Terminal** : plusieurs terminaux par lab ; **historique + sorties conservés** ; à la **reprise d’un lab**, tout retrouver (terminaux, commandes, résultats).
- **Bureau** : **vrai bureau** léger, **fait maison** (pas noVNC/XFCE lourd).
- **Interconnexion** : simulateur réseau, capture pcap, requêtes API, terminal lab, client graphique web – **tous connectés au lab**.
- **Scénario** : au démarrage (lab connecté, lab par défaut), **installation des outils nécessaires** au lab pour ce scénario.
- **Reprise lab** : **ne rien perdre** – terminaux, historique, sorties, panneaux, comme c’était.

- **Court terme** : fait (Phase 1) – terminal panel, backend lab-terminal, exit, resize.
- **Moyen terme** : Phase 2 faite – persistance par lab (onglets, journal, PiP, contexte scénario, journal complet) **et sorties PTY** : backend lab-terminal bufferise les sorties par session (`?session=tabId`), replay au reconnect ; client envoie `session` dans l’URL du WebSocket. Au rechargement, l’historique des commandes affiché dans chaque onglet terminal est restauré. Puis Phase 3 (attaquant riche, packs), Phase 4 (bureau fait maison), Phase 5 (interconnexion, reprise lab complète).

**Scintillement** : pour le moment plus de scintillement signalé (à surveiller). Si ça revient, désactiver `contain`/`translateZ(0)` et vérifier avec React DevTools Profiler.

### Terminal web attaquant (panneau et PiP)

- **Backend** : lab-terminal (Go, PTY + WebSocket), route `/terminal-house/`, client `?path=terminal-house`. Sessions par onglet (`?session=<tabId>`).
- **Panneau terminal** : onglets, resize (poignée, curseur col-resize), exit → fermeture de l’onglet. **Exit fonctionne** : le client envoie `postMessage({ type: 'lab-cyber-terminal-exit' })` à la fermeture du WebSocket, l’app ferme l’onglet concerné. Le reste du panneau (onglets, journal, largeur) est opérationnel.
- **Persistance par lab** : liste des onglets, onglet actif, journal de session (notes/commandes enregistrées), largeur du panneau, état PiP (ouvert/fermé, onglets PiP, position) – tout est **sauvegardé par lab** et restauré au changement de lab ou au rechargement de la page (côté app).
- **Journal complet** : bouton Journal & Stats → « Journal complet (par lab) » : consultation par lab et par scénario ; les notes du panneau terminal sont aussi enregistrées dans ce journal (type note, sessionId, scenarioId).
- **PiP** : persistance par lab (ouvert/fermé, onglets, position, minimisé) ; restauration à la reprise du lab.

**Ce qui est enregistré côté app**  
- Par **lab** : onglets terminal (noms, nombre), onglet actif, journal de session (lignes ajoutées à la main), largeur panneau, état PiP (ouvert, onglets, position, minimisé), scenarioId en vue scénario. Restauré au rechargement et au changement de lab.

**Rechargement de la page**  
- **Sorties PTY persistées** : le backend lab-terminal enregistre les sorties par session (`?session=<tabId>`) et les renvoie au reconnect (replay). Le client `terminal-client.html` envoie le paramètre `session` dans l’URL du WebSocket. Au rechargement, chaque onglet retrouve son historique affiché (scrollback, commandes et sorties). Buffer limité à 512 Ko par session.
- **Exit** : implémenté et opérationnel (panneau et PiP).
- **Double-clic sur un onglet** : ouvre le renommage (délai 500 ms entre deux clics pour distinguer clic simple / double-clic).

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

### Avertissements connus (logs)

- **lab-vuln-network (Redis)** : « Memory overcommit must be enabled » – ce sysctl n’est pas dans un namespace isolé, donc on ne peut pas le passer au conteneur (erreur runc). Pour supprimer le warning : sur l’**hôte** : `sudo sysctl vm.overcommit_memory=1` (optionnel ; Redis fonctionne malgré le warning).
- **lab-bwapp** : « CRIT Set uid to user 0 », « WARN Included extra file » (supervisor) – attendu dans l’image actuelle (supervisor en root) ; pas bloquant.

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
- **Panneau terminal** : onglets, resize, exit (fermeture de l’onglet) OK. Persistance **par lab** : onglets, journal de session, largeur ; restauration au changement de lab et au rechargement. **Session stable** : l’iframe du terminal ne reçoit plus `src` au re-render (src fixé une seule fois au montage), ce qui évite le rechargement intempestif et la perte des commandes pendant l’utilisation. Limite : au rechargement de la **page**, le contenu des sessions est perdu (sorties PTY non persistées côté backend).
- **Terminal PiP** : déplaçable, plusieurs onglets, persistance **par lab** (ouvert/fermé, onglets, position, minimisé). Exit → fermeture de l’onglet. Restauration à la reprise du lab.
- **Journal complet** : Journal & Stats → « Journal complet (par lab) » ; consultation par lab et scénario ; notes du panneau enregistrées avec sessionId et scenarioId.
- **Doc & Cours** : sous-navigation (sidebar thèmes + Doc / Cours / Outils), OWASP Top 10:2021 (catalogue + bloc Learning avec Ouvrir dans l’app / externe).
- **Bibliothèque doc** : isolation du design (`.doc-offline-content-isolated`) pour le HTML récupéré.
- **Capture pcap** : colonnes type Wireshark, filtre, détail ; notice « analyse machine client » (charger .pcap capturé sur son PC).
- Notes par lab, CVE (recherche NVD en app), terminal-full, doc `platform/docs/`, nmap (cap_add), iframe terminal, notes structurées, menu Ouvrir, Lab dropdown, actions flottantes, Options en page, Make help / restart-clean.

---

*Dernière mise à jour : février 2026.*
