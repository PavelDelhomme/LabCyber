# État du projet Lab Cyber

Ce fichier liste ce qui reste à faire en priorité, puis les améliorations, et en fin la liste des éléments déjà réalisés.

---

## 🚨 PRIORITÉ (à traiter en priorité)

- **Scintillement panneau terminal** : l’affichage scintille encore un peu à l’activation ; délai iframe en place, à affiner si besoin.
- **Bouton « + » nouvel onglet terminal** : ne fonctionne pas – corriger le clic (stopPropagation, persistance des onglets).
- **Terminal PiP** : doit être **déplaçable** comme une vidéo YouTube (fenêtre flottante), ne pas prendre la place du panneau ; position et z-index à corriger pour qu’il soit bien au-dessus et déplaçable.
- **Panneau terminal rétracté** : quand le terminal est réduit sur le côté, les boutons **Options, Stats, Journal d’activité** (et CVE, etc.) passent **sous** le panneau et ne sont plus cliquables. Idem si le journal d’activité est ouvert alors que le terminal est rétracté – on ne peut plus fermer. **À faire** : réserver une marge à droite au contenu principal (topbar + FAB) quand un panneau droit est ouvert (terminal, capture, etc.) pour que les boutons restent toujours visibles et accessibles.
- **Lab actif – Ouvrir dans la page** : depuis les options du lab actif, « Capture pcap » et « Simulateur réseau » (et Proxy, Requêtes API) doivent pouvoir **s’ouvrir en panneau** dans la page, pas en nouvel onglet ni en changeant la vue. À faire : **système de panneaux** à droite (terminal, capture, simulateur, proxy, API) avec icônes des panneaux actifs, clic pour afficher le panneau concerné.
- **Journal + Stats** : combiner **Journal d’activité** et **Stats** en un **seul bouton dropdown** (ex. « 📋 ▼ ») pour gagner de la place et libérer de l’espace pour une barre d’icônes de panneaux.
- **CVE** : la recherche par mot-clé affiche déjà les résultats dans le panel ; s’assurer que le flux est clair (recherche → résultats dans le panel, pas ouverture NVD). **À faire plus tard** : « Ouvrir par ID » pourrait aussi afficher le CVE dans le panel au lieu d’ouvrir NVD ; possibilité d’**enregistrer les CVE détectés** (ex. pour un lab) pour les retrouver plus tard.
- **Champs formulaire id/name** : compléter les `id` et `name` partout pour supprimer l’avertissement console (autofill).
- **Redimensionnement panneau terminal** : poignée et listeners à corriger.
- **Panneau capture** : parfois ne s’affiche pas au premier clic ; vérifier toggle et persistance.

---

## 🔲 À faire / à améliorer

### Application

1. **Terminal / bureau**  
   - Terminal = lab par défaut ; si lab actif : proposer **terminal lab actif** ou **lab par défaut**.  
   - **Historique / session terminal** : pouvoir enregistrer l’**état historique** du terminal (attaquant, lab, etc.), prendre des **notes par ligne/session**, et option pour **nettoyer** cet historique. Persistance des sessions/onglets et de l’historique des commandes si possible.

2. **Système de panneaux (côté droit)**  
   - **Multi-panneaux** : terminal, capture, simulateur, proxy, Requêtes API – tous ouvrables en **panneau** (pas seulement en page). Barre d’**icônes** des panneaux actifs à droite ; clic sur une icône ouvre ou met en avant le panneau. Gestion des panneaux par catégorie, position (droite/bas/gauche), taille, session.

3. **Lab actif – Ouvrir en panneau**  
   - Dans le panneau Lab (détails du lab), les actions « Ouvrir dans la page » doivent ouvrir les **panneaux** (terminal, capture, simulateur, proxy, API) et non pas naviguer vers la page ou ouvrir un nouvel onglet.

4. **CVE**  
   - Recherche : résultats dans le panel (déjà en place). À améliorer : affichage par ID dans le panel ; **enregistrer les CVE détectés** (par lab ou global) pour les consulter plus tard.

5. **Capture pcap, simulateur, proxy, API**  
   - Déjà en panneau ou en page. S’assurer que depuis le lab actif on peut tout ouvrir en panneau.

6. **Panneau scénario (barre en bas)**  
   - Afficher l’**avancement** des tâches (fait / en cours / pas commencé), revoir le design (pas décalé à droite).

7. **Autres**  
   - Terminal : redimensionnement, réduction, persistance onglets.  
   - Capture : décodage avancé, Wireshark-like.  
   - Cours pentest, vuln-network/vuln-api, doc projet, sync doc, tests, etc. (voir ancienne section « À faire » pour le détail).

### Infrastructure / doc / contenu

- Sync doc automatique (déjà en place). Tests, doc & cours à compléter, données dynamiques, outils à documenter – voir structure détaillée ci-dessous si besoin.

---

## ⚠️ À vérifier en détail

- Panneau terminal : redimensionnement, réduction, onglets, persistance.  
- Panneau capture : ouverture, fermeture, persistance.  
- Tout ce qui touche aux panneaux et à l’UI : tester en conditions réelles.

---

## 📌 Problèmes signalés (résumés)

- Panneau terminal rétracté cache les boutons topbar/FAB → **à corriger** (marge droite).  
- Terminal PiP pas déplaçable / mauvaise position → **à corriger**.  
- Bouton + nouvel onglet terminal ne marche pas → **à corriger**.  
- Lab actif : Capture / Simulateur ouvrent page ou onglet au lieu du panneau → **à corriger** (système de panneaux).  
- Autres points déjà listés en PRIORITÉ et À faire.

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

- **Panneau terminal** : en place (iframe, onglets, journal). Redimensionnement / persistance à finaliser.
- **Notes par lab**, **CVE** (recherche NVD, résultats en app), **Capture pcap** (colonnes type Wireshark, filtre, détail).
- **Terminal** en nouvel onglet (`#/terminal-full`), **doc** unique `platform/docs/`, **Doc & Cours** (pages par thème), **nmap** (cap_add), **iframe terminal** (X-Frame-Options), **notes structurées** (Rapport / Failles, modèle).
- **Bibliothèque doc** (hors ligne, préférences, catalogue, scénarios docRef), **menu déroulant « Ouvrir dans la page »**, **Lab dropdown**, **actions flottantes** (sidebar rétractée), **Options en page** `#/options`, **Make clean/clean-all**, **Make help** et **restart-clean**.
- Problèmes résolus : modale Options, doc unique, terminal-full, notes lab, CVE in-app, capture Wireshark-like, nmap, default.conf gateway, Doc & Cours détaillé, menu unique Ouvrir, Lab dropdown, boutons flottants.

---

*Dernière mise à jour : février 2026.*
