# Où est la doc ?

- **`docs/` à la racine** (ce dossier) et **`platform/docs/`** ont le **même contenu**.
- La plateforme web (http://127.0.0.1:8080) sert la doc depuis **`platform/docs/`** : au build, ces fichiers sont copiés dans l’image et exposés sous **http://127.0.0.1:8080/docs/** (et dans la vue « Doc. projet »).
- Si tu modifies la doc, mets à jour **`platform/docs/`** (source utilisée par l’app), puis copie vers `docs/` pour garder la cohérence.

**Résumé** : une seule source = `platform/docs/` ; `docs/` à la racine = copie pour consultation hors Docker.
