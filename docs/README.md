# Documentation Lab Cyber

La documentation à jour se trouve dans **`platform/docs/`** (source unique).

- En développement : l’app sert les fichiers depuis `platform/public/docs/` (copie synchronisée depuis `platform/docs/`).
- Au build : `npm run build` copie `platform/docs/` dans `dist/docs/`, servis sous `/docs/` dans l’application.

Pour modifier la doc : éditer les fichiers dans **`platform/docs/`**, puis recopier vers `platform/public/docs/` si besoin (ex. `cp -r platform/docs/. platform/public/docs/`) pour que le mode dev reflète les changements.

Voir aussi **`STATUS.md`** à la racine du projet pour l’état des fonctionnalités et le reste à faire.
