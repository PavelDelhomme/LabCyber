# État du projet Lab Cyber

Ce fichier liste ce qui a été fait récemment, ce qui reste à faire et les points signalés comme problèmes ou non finalisés.

---

## ✅ Réalisé

- **Panneau terminal** : redimensionnable (poignée, largeur 320–900 px), réductible/agrandissable (bouton pour cacher le corps sans fermer), renommage des onglets (double-clic sur le nom, persistance tant que le panneau n’est pas fermé).
- **Notes par lab** : zone de notes dans le panneau Lab (barre du haut), enregistrement par lab, persistance au rechargement.
- **CVE** : recherche par ID et par mot-clé (NVD API 2.0) dans l’app, affichage des résultats et détails (résumé, score CVSS, lien NVD).
- **Capture pcap** : colonnes type Wireshark (Time, Source, Destination, Protocol, Length), filtre par IP/protocole, détail par paquet (IPv4/IPv6, TCP/UDP).
- **Terminal en nouvel onglet** : ouverture via `#/terminal-full` depuis le panneau Lab (même session app, sidebar disponible).
- **Documentation** : une seule source = `platform/docs/` ; synchro vers `platform/public/docs/` ; doublons supprimés dans `docs/` à la racine (voir `docs/README.md`).
- **Doc thématique** : Terminal vs bureau (deux environnements distincts), notes lab, CVE in-app, capture, Linux/connexion (15-LINUX-RESEAU.md), PROXY-VPN, index à jour.
- **Logs gateway** : ajout d’un `default.conf` placeholder dans la gateway pour supprimer le message nginx « default.conf is not a file or does not exist » au démarrage.
- **Doc & Cours** : pages détaillées par thème et sous-catégorie (routes `#/learning`, `#/learning/:topicId`, `#/learning/:topicId/:subId`), fil d’Ariane, bloc Documentation / Cours / Outils avec descriptions.
- **nmap dans le conteneur attaquant** : ajout `cap_add: NET_RAW, NET_ADMIN` dans docker-compose pour que nmap puisse s’exécuter (éviter « Operation not permitted »).
- **Terminal en iframe (panneau)** : gateway nginx envoie `X-Frame-Options: SAMEORIGIN` sur `/terminal/` et masque l’en-tête amont pour autoriser l’affichage du terminal dans le panneau de la plateforme.
- **Ouverture panneau terminal** : persistance renforcée (double `setUiSession` à l’ouverture) pour que le panneau reste ouvert quand on clique « Ouvrir dans la page (panneau) » depuis le lab.
- **Notes lab structurées** : deuxième zone **Rapport / Failles** (stockage `labReport` par lab) + bouton **Insérer modèle rapport** (Cibles, Méthodologie, Découvertes, Failles, Recommandations) pour les rapports de test de cybersécurité.
- **Bibliothèque doc (type devdocs)** : vue **« Bibliothèque doc (hors ligne) »** (`#/doc-offline`) pour **récupérer** les documentations externes et les **consulter dans l’app** sans ouvrir les liens. Couvre **cybersécurité, réseau, systèmes, administration, développement, bases de données**. Catalogue dans `platform/data/docSources.json` ; stockage en IndexedDB (`offlineDocs`) ; boutons Récupérer / Mettre à jour par source ; affichage en page avec fil d’Ariane. Les sites qui bloquent le CORS affichent un message invitant à « Ouvrir en ligne » ; les autres sont récupérables et lisibles hors ligne.
- **Bibliothèque doc – améliorations** :  
  - **Visibilité** : compteur « X disponibles hors ligne / Y au total », filtres **Tous | Récupérés | Non récupérés**, badges **Hors ligne** (vert) / **En ligne** (gris) par source, bloc **Accès rapide (récupérés)** pour ouvrir en un clic les docs déjà en cache.  
  - **Bouton « Ouvrir en ligne »** : lien externe redesigné (style bouton secondaire avec icône ↗), cohérent dans la liste et dans la page de lecture.  
  - **Préférences doc** (Options > Bibliothèque doc) : **sources personnalisées** (ajout par URL, nom, catégorie ; suppression) ; stockage `docPreferences` en IndexedDB (`customSources`, `versionOverrides`, `autoFetchIds`). Les sources personnalisées apparaissent dans la vue Bibliothèque doc avec les sources du catalogue.  
  - **Catalogue** : titre/description en **anglais par défaut** (outils en anglais) ; URLs MDN en **en-US** ; champs optionnels `version` pour évolution future (latest / version spécifique).  
  - **Scénarios** : une tâche de scénario peut avoir un champ **`docRef`** (id d’une source de la bibliothèque) ; un lien **« View doc: [label] »** ouvre la doc dans l’app (`#/doc-offline/:id`). Exemple : scénario « Premier contact – Scan » avec `docRef: "nmap-man"` pour la tâche sur nmap.

- **Menu déroulant « Ouvrir dans la page »** : un seul menu à la place des boutons éparpillés (Terminal panneau, Terminal PiP, Capture pcap, Simulateur réseau, Proxy, Requêtes API). Utilisé dans la topbar et dans le panneau Lab. Styles dans `platform/css/style.css` ; listener document différé pour éviter fermeture intempestive.

- **Bouton Lab avec menu déroulant** : quand un lab actif autre que le défaut est sélectionné, le bouton Lab devient un dropdown proposant : Détails du lab, Terminal (panneau/nouvel onglet/PiP), Capture (panneau/nouvel onglet), Simulateur, Proxy, API, Désactiver le lab. Composant `LabButtonDropdown.jsx`.

- **Actions flottantes quand sidebar rétractée** : quand le panneau latéral est fermé, les boutons d’action (Lab, Ouvrir, Stats, Options, Journal) deviennent flottants à droite (bloc fixe avec bordure/ombre) pour rester visibles ; la barre de recherche et le filtre gardent un padding pour ne pas être recouverts.

---

## 🔲 À faire / à améliorer

### Application

1. **Terminal / bureau**  
   - Actuellement : terminal web = conteneur attaquant (Kali/ttyd), bureau noVNC = conteneur desktop (XFCE) ; ce sont deux environnements différents.  
   - Option à décider : garder tel quel (doc claire) ou unifier (ex. bureau sur le même conteneur Kali) et adapter `docker-compose` / gateway.

2. **Capture pcap**  
   - Amélioration possible : décodage plus poussé (payload HTTP, filtres avancés), ou intégration d’un outil type Wireshark web pour affichage complet. Actuellement : liste + colonnes + détail hex + L3 (IP, proto, ports).

3. **CVE**  
   - Limite NVD : 5 requêtes / 30 s sans clé API ; possibilité d’ajouter support clé API pour plus de requêtes.

4. **Cours et scénarios pentest**  
   - Contenu déjà présent (learning, scénarios existants). À enrichir : plus de cours dédiés pentest et scénarios explicites “pentest” (méthodo, livrables), bien rangés avec les challenges, et liens clairs avec bureau, terminal, lab, proxy, simulateur, capture.

5. **Vue Doc. projet**  
   - S’assurer que la liste des docs (data/docs.json) inclut tous les fichiers de `platform/docs/` (ex. CVE.md, UTILISER_LE_LAB.md, 15-LINUX-RESEAU.md) pour qu’ils soient visibles et ouverts dans l’app.

6. **Panneau terminal**  
   - Si le panneau est fermé (croix), les onglets/sessions sont recréés au prochain ouvert ; les noms personnalisés ne sont pas persistés après fermeture du panneau (comportement actuel). À décider : persister les noms d’onglets même après fermeture.  
   - **Problème signalé** : depuis certaines vues (ex. Doc & Cours), « Ouvrir dans la page (panneau) » n’affiche rien ou le panneau se referme. Vérifier après déploiement (X-Frame-Options + persistance déjà corrigés ; listener document différé appliqué sur `OpenInPageDropdown`).  
   - **Session terminal** : au rechargement de la page, la session ttyd (shell) est perdue (comportement normal du navigateur). Pour ne pas perdre : éviter de recharger, ou ouvrir le terminal en onglet dédié et ne pas le fermer.

7. **vuln-network / vuln-api**  
   - Tous les cas de figure et scénarios d’apprentissage ne sont pas encore en place. Compléter les rooms, scénarios et doc pour couvrir l’usage de vuln-network (SSH, Redis) et vuln-api (endpoints, vulns) de A à Z.

8. **Simulateur réseau**  
   - À améliorer (cohérence, persistance, intégration avec le lab actif). Tout doit rester en l’état dans le lab actif sauf option explicite pour nettoyer.

9. **Capture / Wireshark**  
   - La capture pcap doit pouvoir s’ouvrir en **panneau** (comme le terminal) et être accessible depuis le lab actif. Données de capture conservées tant qu’on ne nettoie pas.

10. **Documentation hors ligne (compléments)**  
    - **En place** : visibilité (compteur, filtres, badges, accès rapide), bouton « Ouvrir en ligne » redesigné, préférences (sources personnalisées dans Options), catalogue EN, scénarios avec `docRef`.  
    - **À améliorer** : sélection de version dans l’UI (versionOverrides), auto-récupération (autoFetchIds), recherche full-text, proxy CORS, mise à jour automatique périodique.

11. **Cybersécurité IA, data**  
    - Ajouter des rooms, doc et scénarios dédiés : cybersécurité orientée **IA** (modèles, données, prompt injection, etc.) et **data** (protection des données, RGPD, fuites).

### Infrastructure / doc

12. **Sync doc**  
   - Après modification de `platform/docs/`, recopier vers `platform/public/docs/` pour que le mode dev reflète les changements (ou ajouter un script `npm run sync-docs`).

13. **Tests**  
   - Relancer les tests après les changements (build, plateforme, cibles) et mettre à jour TESTS.md si besoin.

### Doc & Cours (à compléter en priorité)

14. **Contenu complet par thème**  
   - Chaque thème doit avoir des **sous-sections** avec des **pages dédiées** : explications, exemples, exercices. Pas seulement des courts paragraphes.  
   - **Documentation récupérée** : la **Bibliothèque doc** permet de récupérer et afficher en cache les docs (catalogue + sources personnalisées). Les **scénarios** peuvent référencer une doc via `docRef` (lien « View doc »). À étendre : lien depuis Doc & Cours vers « Ouvrir dans la Bibliothèque doc », affichage inline d’une doc cachée.  
   - **Sélection de version** (comme devdocs.io) : UI pour choisir version (latest / spécifique) par source — `versionOverrides` et champs `version` en place, à brancher dans l’interface.  
   - Objectif : interface type **devdocs.io** (doc à jour, navigable, recherche) — base en place avec la Bibliothèque doc et les améliorations récentes.

15. **Sections à ajouter / étendre**  
    - **Linux** (système, CLI, permissions, services, réseau).  
    - **Réseau** (TCP/IP, sniffing, analyse paquets, proxy).  
    - **Sniffing / spoofing** (déjà partiellement en place).  
    - **Cryptographie** (déjà présent, à enrichir avec exemples et exercices).  
    - **Stéganographie** (déjà présent, à enrichir).  
    - **OSINT** (déjà présent, à enrichir).  
    - **Web / Webapp** (OWASP, injection, XSS, etc. – déjà présent).  
    - **Proxy** (config, Burp, mitmproxy, export terminal).  
    - **Wi‑Fi** (802.11, aircrack-ng, scénarios lab si possible).  
    - **Bluetooth, RFID, RF** : sections + scénarios et/ou simulation si réalisable dans le lab.

16. **Scénarios et parcours**  
    - Scénarios pour **réseau** (scan, exploitation, pivot).  
    - Scénarios **Bluetooth, Wi‑Fi, RFID** (tests, simulation, outils).  
    - Scénarios **social engineering**, **entreprise**, **applicatif** (déjà partiellement en place).  
    - Tout doit s’**intégrer** avec : bureau, terminal, lab, proxy, simulateur réseau, capture, requêtes API.

17. **Données et stockage dynamiques**  
    - **Fourniture dynamique** des fichiers JSON (learning, scenarios, challenges, docs) : chargement depuis une API ou un stockage configurable, pas seulement des JSON statiques.  
    - **Système d’apprentissage** : parcours de **cracking** (mots de passe, hashes), **modification de code source** (ex. patch, analyse), **dump mémoire** (concepts, outils, exercices).  
    - Contenu évolutif sans rebuild : mise à jour des cours, scénarios et docs via JSON ou API.

18. **Outils à ajouter / documenter**  
    - Côté lab : outils pour **Wi‑Fi** (aircrack-ng, etc.), **Bluetooth** (bluetoothctl, btscanner si pertinent), **analyse mémoire** (concepts, GDB, volatility si possible), **reverse / patch** (basics).  
    - Côté plateforme : possibilité d’afficher une **doc d’outil** par version (type devdocs), **liens** vers doc officielle récupérée ou intégrée.

---

## 📌 Problèmes signalés (résumés)

- Doublon de docs (racine vs platform/docs) → **résolu** : source unique `platform/docs/`, `docs/` à la racine réduit à un README.
- Impossible d’ouvrir le terminal en nouvel onglet “avec la session lab” → **résolu** via `#/terminal-full`.
- Panneau terminal non redimensionnable / non réductible / onglets non renommables → **résolu**.
- Pas de notes par lab → **résolu** (zone dans le panneau Lab).
- CVE : seulement lien NVD, pas de recherche ni détails dans l’app → **résolu** (recherche + résultats + détails in-app).
- Capture : pas type Wireshark → **résolu** (colonnes Time, Source, Dest, Protocol, Length + filtre).
- Terminal vs bureau : confusion sur les environnements → **documenté** (UTILISER_LE_LAB, 15-LINUX-RESEAU).
- Besoin de plus de contenu Linux / VPN / pentest → **documentation et learning** mis à jour (15-LINUX-RESEAU, PROXY-VPN, learning.json).
- Logs gateway « default.conf is not a file or does not exist » → **résolu** (fichier placeholder ajouté dans gateway).
- Doc & Cours : pas de pages détaillées par thème → **résolu** (pages par thème/sous-catégorie, fil d’Ariane, liens doc/cours/outils).
- nmap « Operation not permitted » dans l’attaquant → **résolu** (cap_add NET_RAW, NET_ADMIN).
- Terminal en panneau n’affiche rien / ne s’ouvre pas → **partiellement adressé** (X-Frame-Options SAMEORIGIN sur /terminal/, persistance à l’ouverture). À valider après rebuild gateway.
- Notes pas structurées pour rapports de test → **résolu** (zone Rapport / Failles + modèle insérable).
- Menu / boutons trop dispersés pour ouvrir terminal, capture, etc. → **résolu** (menu déroulant unique « Ouvrir dans la page »).
- Lab actif : pas d’accès rapide terminal/capture/simulateur depuis le bouton Lab → **résolu** (Lab dropdown quand lab actif non défaut).
- Boutons Stats/Options/Journal invisibles quand sidebar rétractée → **résolu** (actions flottantes à droite).

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

*Dernière mise à jour : 13 février 2026.*
