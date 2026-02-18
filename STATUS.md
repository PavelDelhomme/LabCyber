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

### Infrastructure / doc

7. **Sync doc**  
   - Après modification de `platform/docs/`, recopier vers `platform/public/docs/` pour que le mode dev reflète les changements (ou ajouter un script `npm run sync-docs`).

8. **Tests**  
   - Relancer les tests après les changements (build, plateforme, cibles) et mettre à jour TESTS.md si besoin.

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

---

## Où modifier quoi

| Élément        | Emplacement principal        |
|----------------|------------------------------|
| Documentation | `platform/docs/`             |
| Données app   | `platform/data/` (JSON)      |
| Code app      | `platform/src/`              |
| Doc servie    | Copie dans `platform/public/docs/` (et dans `dist/docs/` au build) |

---

*Dernière mise à jour : février 2025.*
