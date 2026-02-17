# Catégorie Réseau – Pentest et sécurité réseau

## Objectifs

- Découverte des **hôtes et services** (scan).
- Exploitation de services **mal configurés** (SSH, Redis, etc.).
- **Brute force** et renforcement des bonnes pratiques.

## Cible dans le lab : vuln-network

Une machine avec des services volontairement vulnérables :

| Service | Port | Détail | Objectif |
|---------|------|--------|----------|
| **SSH** | 22 (exposé en 4222 sur l’hôte) | root / labpassword | Brute force, accès à distance |
| **Redis** | 6379 | Pas d’authentification | Accès non autorisé, éventuelle écriture de clés |

Hostname depuis le lab : `vuln-network` ou `vulnbox`.

## Tests à réaliser (checklist)

- [ ] **Découverte** : `nmap -sV vuln-network`, `nmap -sC -p- vuln-network`
- [ ] **Redis** : connexion sans auth `redis-cli -h vuln-network`, `INFO`, `CONFIG GET dir`
- [ ] **SSH** : connexion avec identifiants faibles, puis brute force avec Hydra
- [ ] **Énumération** : versions des services, recherche d’exploits (recherche manuelle ou searchsploit si ajouté)

## Commandes (conteneur attaquant)

```bash
docker compose exec attaquant bash

# Scan des ports et versions
nmap -sV vuln-network
nmap -sC -p 22,6379 vuln-network

# Connexion Redis (sans mot de passe)
redis-cli -h vuln-network
# Puis : INFO, KEYS *, CONFIG GET *

# SSH avec mot de passe faible
ssh root@vuln-network -p 22
# Mot de passe : labpassword

# Brute force SSH (liste de mots de passe)
echo "labpassword" > /tmp/pass.txt
hydra -l root -P /tmp/pass.txt ssh://vuln-network -t 4
```

## Bonnes pratiques (à appliquer en prod)

- Redis : `requirepass`, `bind 127.0.0.1` si pas besoin d’accès réseau.
- SSH : clés, désactiver root login, rate limiting (fail2ban).
