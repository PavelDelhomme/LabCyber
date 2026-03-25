# Architecture modulaire – Lab Cyber

L’app est conçue pour que **rooms, challenges, vues, sources de données et actions** s’ajoutent comme des **briques** sans refondre le noyau. Ce document décrit les points d’extension et comment ajouter une nouvelle fonctionnalité.

---

## 1. Ajouter une **source de données** (JSON chargé au démarrage)

**Fichier** : `platform/src/lib/dataSources.js`

- Ajouter une entrée dans le tableau **`DATA_SOURCES`** :
  - **`key`** : clé d’état exposée par `useStore()` (ex. `'data'`, `'challenges'`).
  - **`path`** : URL du JSON (ex. `'/data/rooms.json'`).
  - **`normalize`** : fonction `(raw) => value` pour adapter la réponse (tableau, objet, etc.).
  - **`defaultVal`** : valeur utilisée si le fetch échoue ou renvoie null.

- Exposer la clé dans **`platform/src/lib/store.js`** : ajouter un `useState(initial)` et l’inclure dans l’objet `setters` et dans le `return` de `useStore()`.

- Mettre le fichier JSON dans **`platform/data/`** et le copier (ou lier) vers **`platform/public/data/`** pour que le navigateur puisse le charger.

**Exemple** : ajouter `tracks.json` (parcours pédagogiques) :

```js
// dataSources.js
{ key: 'tracks', path: '/data/tracks.json', normalize: (x) => (x?.tracks) || [], defaultVal: [] }
```

Puis dans `store.js` : `const [tracks, setTracks] = useState([]);`, ajouter `tracks: setTracks` dans `setters` et `tracks` dans le return.

---

## 2. Ajouter une **vue** (page / route)

**Fichier** : `platform/src/App.jsx`

- Importer le composant :  
  `import MaNouvelleView from './views/MaNouvelleView';`

- Ajouter une entrée dans **`VIEW_REGISTRY`** :
  - **`id`** : identifiant de la vue (ex. `'ma-vue'`). URL sera `#/ma-vue`.
  - **`pathPrefix`** : segment d’URL (ex. `'ma-vue'`). Laisser `''` pour la page d’accueil.
  - **`pathParam`** : si la route a un paramètre (ex. `#/scenario/xxx`), mettre le nom du paramètre (`'scenarioId'`, `'roomId'`, etc.). Sinon `null`.
  - **`pathParam2`** : optionnel, pour un 2ᵉ segment (ex. `learning/topic/sub`).
  - **`Component`** : le composant Preact.

- Aucun autre endroit à modifier : `VIEWS`, `parseHash()` et `hashFor()` sont dérivés du registre.

**Exemple** : vue `#/parcours` sans paramètre :

```js
{ id: 'parcours', pathPrefix: 'parcours', pathParam: null, Component: ParcoursView }
```

Penser à ajouter un lien dans la **Sidebar** ou le **Dashboard** vers `#/parcours`.

---

## 3. Ajouter un **type d’action** (validation automatique des challenges)

**Fichier** : `platform/src/lib/actionTypes.js`

- Ajouter une constante dans **`ACTION`** :  
  `MA_NOUVELLE_ACTION: 'ma_nouvelle_action'`

- Émettre l’action depuis le composant concerné :  
  `dispatchLabAction({ action: ACTION.MA_NOUVELLE_ACTION, ...détails })`

- Pour qu’un **challenge** se valide automatiquement quand cette action est détectée, dans **`platform/data/challenges.json`** (et `platform/public/data/challenges.json`) ajouter dans l’entrée du défi :

  ```json
  "autoValidate": {
    "actionMatch": { "action": "ma_nouvelle_action", "champOptionnel": "valeur" }
  }
  ```

La logique de correspondance est dans **`App.jsx`** (écoute `lab-cyber-action`, journal, `runChallengeValidation`). Les champs optionnels supportés dans `actionMatch` sont : **`action`**, **`target`**, **`urlContains`**, **`method`**.

---

## 4. Ajouter une **room**

**Fichiers** : `platform/data/rooms.json` et `platform/public/data/rooms.json`

Une room est un objet dans le tableau **`rooms`** avec au minimum :

- **`id`** : identifiant unique (ex. `'ma-room'`).
- **`title`** : titre affiché.
- **`description`** : texte de présentation.
- **`category`** : id d’une catégorie existante dans **`categories`** (ex. `'web'`, `'network'`).
- **`difficulty`** (optionnel) : ex. `'Débutant'`, `'Facile'`.
- **`objectives`** (optionnel) : tableau de strings.
- **`machines`** (optionnel) : tableau de `{ name, urlKey?, url?, credentials?, note? }`. `urlKey` peut être `dvwa`, `juice`, `api`, `bwapp`, `terminal`, `desktop` (voir `getMachineUrl` dans `store.js`).
- **`tasks`** (optionnel) : tableau de `{ title, content?, tip?, command?, docRef? }`.

Les **categories** sont définies dans le même fichier (`categories`). Pour une nouvelle catégorie, ajouter une entrée avec **`id`**, **`name`**, **`icon`**, **`color`**.

Aucun changement de code nécessaire : les rooms sont lues depuis `data.rooms` et affichées par **RoomView** et le **Dashboard**.

---

## 5. Ajouter un **scénario**

**Fichiers** : `platform/data/scenarios.json` et `platform/public/data/scenarios.json`

Un scénario est un objet dans **`scenarios`** avec une structure proche des rooms :

- **`id`**, **`title`**, **`description`**, **`difficulty`**, **`category`**, **`time`** (optionnel).
- **`machines`** : liste de `{ name, urlKey?, url?, note? }`.
- **`tasks`** : liste de `{ title, content?, command?, tip?, learn?, docRef? }`.

La progression (tâches cochées, statut) est gérée par le **storage** (scenarioId + index de tâche). Aucun changement de code nécessaire pour un nouveau scénario.

---

## 6. Ajouter un **challenge**

**Fichiers** : `platform/data/challenges.json` et `platform/public/data/challenges.json`

Une entrée dans le tableau **`challenges`** :

- **`id`** : identifiant unique (ex. `'chall-14-mon-defi'`).
- **`title`**, **`description`**, **`category`**, **`difficulty`** (optionnel), **`hint`**, **`validation`** (texte explicatif).
- **`roomId`** (optionnel) : id d’une room pour le bouton « Voir la room ».
- **`downloadUrl`** (optionnel) : URL ou chemin pour « Télécharger » (ex. `/challenges/stego/image.jpg`).
- **`autoValidate`** (optionnel) : règles de validation automatique :
  - **`outputContains`** : tableau de chaînes (ou une chaîne) qui doivent apparaître dans la **sortie terminal**.
  - **`commandContains`** : idem pour les **commandes** tapées dans le terminal.
  - **`actionMatch`** : objet pour valider via une **action** (voir section 3). Champs possibles : `action`, `target`, `urlContains`, `method`.

Un défi peut combiner terminal et action : il est validé dès que les critères terminal **ou** les critères action sont satisfaits.

---

## 7. Récapitulatif des fichiers clés

| Objectif              | Fichier(s) principal(aux)                          |
|------------------------|----------------------------------------------------|
| Nouvelle donnée JSON   | `src/lib/dataSources.js`, `src/lib/store.js`       |
| Nouvelle page / route  | `src/App.jsx` (VIEW_REGISTRY + import)             |
| Nouveau type d’action  | `src/lib/actionTypes.js` + composant qui dispatch  |
| Nouvelle room          | `data/rooms.json` (+ `public/data/rooms.json`)     |
| Nouveau scénario       | `data/scenarios.json` (+ `public/data/`)            |
| Nouveau challenge      | `data/challenges.json` (+ `public/data/`)           |

En restant sur ces points d’extension, toute nouvelle brique (room, challenge, vue, source de données, action) s’ajoute sans modifier la logique centrale du routeur, du store ou de la validation.
