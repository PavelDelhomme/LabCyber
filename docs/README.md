# Documentation Lab Cyber

La documentation à jour se trouve dans **`platform/docs/`** (source unique).

- En développement : l’app sert les fichiers depuis `platform/public/docs/` (copie synchronisée depuis `platform/docs/`).
- Au build : `npm run build` copie `platform/docs/` dans `dist/docs/`, servis sous `/docs/` dans l’application.

Pour modifier la doc : éditer les fichiers dans **`platform/docs/`**, puis recopier vers `platform/public/docs/` si besoin (ex. `cp -r platform/docs/. platform/public/docs/`) pour que le mode dev reflète les changements.

Voir aussi **`STATUS.md`** à la racine du projet pour l’état des fonctionnalités et le reste à faire.

## Dépannage rapide

- **Console navigateur** : l’erreur « A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received » vient en général d’une **extension de navigateur**, pas du code du lab. Tu peux l’ignorer ou désactiver les extensions pour vérifier.
- **Terminal 502** : si le panneau terminal affiche une erreur 502, le backend lab-terminal peut mettre quelques secondes à démarrer. Reconstruire l’image attaquant : `docker compose build --no-cache attaquant && docker compose up -d`. Vérifier : `make terminal-check`. Voir STATUS.md section Terminal web attaquant.
