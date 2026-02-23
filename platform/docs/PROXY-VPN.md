# Proxy et accès distant (VPN / tunnel) – Lab Cyber

Ce document décrit l’usage du **proxy Squid** dans le lab et les options d’**accès distant** (tunnel SSH, VPN).

## Proxy Squid

Le lab peut être démarré avec un **proxy HTTP Squid** (port 3128) pour s’entraîner au trafic via proxy, pivot ou analyse.

### Démarrer le lab avec le proxy

```bash
make proxy
```

ou :

```bash
docker compose --profile proxy up -d
```

Le proxy est alors accessible :

- **Depuis l’hôte** : `http://127.0.0.1:3128`
- **Depuis le réseau du lab** (ex. conteneur attaquant) : `http://proxy:3128`

### Utilisation

- **Navigateur** : configure le proxy HTTP sur `127.0.0.1:3128` pour faire passer le trafic par le lab.
- **curl** : `curl -x http://127.0.0.1:3128 http://example.com`
- **Depuis l’attaquant** : `curl -x http://proxy:3128 http://platform/` (pour tester le trafic via proxy).

La configuration Squid du lab est dans `proxy/squid.conf` (tout autoriser, usage éducatif uniquement).

### Démarrer / arrêter uniquement le proxy

- Démarrer le proxy (lab déjà up) : `make up-proxy`
- Arrêter le proxy : `make down-proxy`

---

## Accès distant (tunnel SSH, VPN)

Le lab tourne en local. Pour y accéder depuis une autre machine (ou un réseau distant), tu peux utiliser un **tunnel SSH** ou un **VPN** sur l’hôte.

### Tunnel SSH (simple)

Depuis la machine qui héberge le lab, expose les ports via SSH :

Sur la **machine cliente** (distant) :

```bash
ssh -L 4080:localhost:4080 -L 5000:localhost:5000 -L 4280:localhost:4280 -L 3128:localhost:3128 user@IP_MACHINE_LAB
```

Ensuite, sur le client, ouvre http://localhost:4080 pour la plateforme, etc.

### VPN (WireGuard / OpenVPN sur l’hôte)

Le lab **ne contient pas** de conteneur VPN prêt à l’emploi (WireGuard dans Docker nécessite des privilèges et une config réseau hôte). Pour un accès type VPN :

1. **Installer WireGuard (ou OpenVPN) sur la machine hôte** qui exécute Docker (Linux, Windows, macOS).
2. Les clients VPN se connectent à l’hôte ; une fois connectés, ils peuvent accéder aux services exposés (4080, 5000, etc.) via l’IP de l’hôte.

C’est une configuration système à faire en dehors du dépôt Lab Cyber. Des tutoriels existent pour [WireGuard](https://www.wireguard.com/quickstart/) et [OpenVPN](https://openvpn.net/community-resources/).

---

## Récapitulatif des commandes (Makefile)

| Commande      | Effet                          |
|---------------|---------------------------------|
| `make up`     | Démarrer le lab                 |
| `make proxy`  | Démarrer le lab + proxy Squid   |
| `make blue`   | Démarrer le lab + Suricata      |
| `make up-proxy` | Démarrer seulement le proxy  |
| `make down`   | Arrêter le lab                  |
| `make test`   | Lancer les tests (résilient si lab arrêté) |
| `make test-full` | Lancer les tests (lab obligatoire) |
| `make shell`  | Shell dans le conteneur attaquant |

Voir aussi [GETTING_STARTED.md](GETTING_STARTED.md) et [00-INDEX.md](00-INDEX.md).
