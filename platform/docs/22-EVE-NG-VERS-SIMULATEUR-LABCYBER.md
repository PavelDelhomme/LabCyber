# Correspondance EVE-NG ↔ Simulateur LabCyber

Ce doc sert de référence pour aligner les **nœuds disponibles dans EVE-NG** avec le **simulateur réseau LabCyber** (cartes, bâtiments, étages) et le catalogue `backendImages.json`.

---

## Nœuds EVE-NG que tu as actuellement

D'après ta liste EVE (Add node) :

| Nœud dans EVE-NG | Backend | Id dans backendImages | Remarque |
|------------------|---------|------------------------|----------|
| **Virtual PC (VPCS)** | qemu | `vpcs` | Déjà dans le catalogue |
| **Linux** | qemu | `linux-netem`, `alpine-qemu`, `ubuntu-server-qemu`, etc. | Plusieurs images Linux |
| **Arista vEOS Switch** | qemu-network | `veos` | Image veos-4.28 (ou version installée) |
| **Cisco ASA** | dynamips ou qemu | `asav` (ASA virtuel) | En physique = image Dynamips selon version |
| **Cisco ASAv** | qemu-network | `asav` | Déjà dans le catalogue |
| **Cisco IOS 17190 (Dynamips)** | dynamips | `c1710` | Routeur 1710 |
| **Cisco IOS 3725 (Dynamips)** | dynamips | `c3725` | Routeur 3725 |
| **Cisco IOS 7206VXR (Dynamips)** | dynamips | `c7200` | Routeur 7200 |
| **Cisco Nexus Dashboard (ND)** | qemu-network | `nexus-dashboard` | Ajouté au catalogue |
| **Citrix SD-WAN** | qemu-network | `ctxsdw` | Ajouté au catalogue |
| **F5 BIG-IP LTM VE** | qemu-network | `bigip-ltm` | Ajouté au catalogue |
| **A10 vThunder** | qemu-network | `a10-vthunder` | Ajouté au catalogue |

Aucune image existante n'a été supprimée : seuls des ajouts ont été faits pour ces nœuds EVE.

---

## Simulateur LabCyber : bâtiments et étages

Le simulateur utilise un **lieu de travail unique** (comme Packet Tracer Physical Workspace ou les outils de plans d'étage) : un seul contrôle pilote à la fois ce que tu vois sur la carte et où sont placés les nouveaux appareils.

### Lieu de travail (workflow type architecte)

- **Un seul sélecteur** : **Lieu de travail** avec les options : *Toute la carte* | *Sans bâtiment (non assignés)* | *Bâtiment (tout)* | *Bâtiment — RDC* (ou autre étage).
- **Carte = contenu du lieu** : la carte affiche uniquement les appareils du lieu choisi. En choisissant « Bâtiment A — RDC », tu vois seulement les nœuds de cette pièce.
- **Placement** : les nouveaux appareils ajoutés sur la carte sont automatiquement assignés au lieu de travail actuel (bâtiment + premier étage si tu as choisi un bâtiment entier, ou l'étage sélectionné si tu as choisi une pièce).
- **Cartes bâtiment** : chaque bâtiment est une carte avec ses étages ; sur chaque étage, bouton **Ouvrir** pour définir ce lieu comme lieu de travail (la carte bascule sur cette pièce). L'étage actif est mis en évidence.
- **Légende au-dessus du canevas** : « Vue : Toute la carte » ou « Vue : Bâtiment A — RDC » pour toujours savoir où on est.
- **Tout afficher** : bouton pour revenir à « Toute la carte ».

Modèle de données : **Bâtiment** = zone avec liste d'étages ; **Étage** = pièce/salle ; chaque nœud a `buildingId` et `buildingFloorId`. Tu peux aussi réassigner un nœud depuis le panneau (Bâtiment / Zone, Étage / Salle).

---

## Export vers un lab EVE-NG-like

La topologie dessinée dans le simulateur peut être exportée au format **eve-ng-lab** (nœuds + liens + backend/image par nœud). Les **images mises de côté** sur la page EVE-NG (iframe) sont enregistrées en local et réutilisées comme images par défaut à l'export.

- Types de nœuds de base : PC, routeur, switch, serveur.
- Mapping backend : PC/serveur → Docker, routeur → Dynamips, switch → IOL (modifiable selon les images que tu choisis).
- Les images disponibles dans EVE (VPCS, Linux, Arista vEOS, Cisco ASAv, 7200, 3725, 1710, etc.) correspondent aux ids listés ci-dessus dans `backendImages.json`.

---

## Erreurs console (EVE) non bloquantes

Les messages que tu vois en console sur http://127.0.0.1:9080/ sont **normaux** et n'empêchent pas l'usage :

- **401 Unauthorized** sur `/api/auth` avant login → attendu.
- **200 OK** sur `/api/auth/login` → connexion OK.
- **XML Parsing Error** sur `/VERSION` → vieux format de réponse, ignorable.
- **404** sur favicon, `company.png`, `bootstrap.min.css.map` → ressources optionnelles.
- Avertissements CSS (`-moz-*`, `filter`, etc.) → compatibilité navigateur, pas bloquant.

Tu peux continuer à utiliser EVE et le simulateur LabCyber en te basant sur cette correspondance et sur le système bâtiments/étages déjà en place.
