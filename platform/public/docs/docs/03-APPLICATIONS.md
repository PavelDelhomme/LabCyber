# Catégorie Applications / API – Sécurité applicative et API

## Objectifs

- Tester la **sécurité des API** (REST).
- Pratiquer **SQLi**, **IDOR**, **authentification faible**, **exposition de données**.

## Cible dans le lab : vuln-api

API REST volontairement vulnérable (Flask) :

- **URL** : http://localhost:5000 ou http://vuln-api (depuis le lab)
- **Endpoints** :
  - `POST /api/login` – login/password (auth faible, pas de rate limit).
  - `GET /api/users/<id>` – IDOR (accès aux utilisateurs sans contrôle du token).
  - `GET /api/products?q=` – SQLi dans le paramètre `q`.

Identifiants de test : `admin` / `admin123`, `user` / `user123`.

## Tests à réaliser (checklist)

- [ ] **Authentification** : login avec admin/admin123, tester des mots de passe faibles, pas de blocage après N tentatives.
- [ ] **IDOR** : appeler `GET /api/users/1` et `GET /api/users/2` sans token ou avec un token d’un autre user.
- [ ] **SQLi** : `GET /api/products?q=' OR '1'='1`, `q=1' UNION SELECT ...`, puis utiliser sqlmap.
- [ ] **Données sensibles** : voir si les réponses exposent trop d’infos (rôles, champs inutiles).

## Commandes (conteneur attaquant)

```bash
# Depuis la machine hôte ou le conteneur
curl -X POST http://vuln-api:5000/api/login -H "Content-Type: application/json" -d '{"login":"admin","password":"admin123"}'

curl http://vuln-api:5000/api/users/1
curl http://vuln-api:5000/api/users/2

# SQLi
curl "http://vuln-api:5000/api/products?q=' OR '1'='1"

# sqlmap
sqlmap -u "http://vuln-api:5000/api/products?q=1" --batch
```

## Compléments

- **Juice Shop** propose aussi des défis orientés API (voir [01-WEB.md](01-WEB.md)).
- En entreprise : OWASP API Security Top 10, tests sur tokens (JWT), rate limiting, validation des entrées.
