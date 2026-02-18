# Topologie et réseau du lab

Le lab tourne sur un **seul réseau Docker** (`lab-network`). Tout passe par la **gateway** sur le port 8080 pour l’interface web ; les conteneurs communiquent entre eux par leur nom.

## Schéma simplifié

```
                    Internet / localhost
                            |
                     [ Port 8080 ]
                            |
                    +-------+-------+
                    |    GATEWAY    |  (nginx : lab.local, dvwa.lab, api.lab, …)
                    +-------+-------+
                            |
              +-------------+-------------+
              |                           |
    +---------+---------+       +---------+---------+
    |    PLATFORM      |       |    TERMINAL      |
    |  (interface web) |       |  (ttyd → attaquant)
    +------------------+       +------------------+
              |                           |
              |              +------------+------------+
              |              |      ATTAQUANT (Kali)   |
              |              |  nmap, hydra, scapy…   |
              |              +------------+------------+
              |                           |
              |         lab-network (bridge)
              |                           |
    +---------+---------+       +---------+---------+
    |  vuln-network    |       |   vuln-api        |
    |  SSH 22, Redis   |       |   Flask 5000      |
    +------------------+       +------------------+
    |  dvwa  |  juice  |  bwapp  |  desktop (noVNC)  |
    +--------+--------+---------+-------------------+
```

## Accès depuis l’extérieur

| Ce que tu ouvres | Où ça va |
|------------------|-----------|
| http://127.0.0.1:8080 | Plateforme (tableau de bord, rooms, scénarios) |
| http://127.0.0.1:8080/terminal/ | Terminal web = **machine attaquant** (Kali) |
| http://127.0.0.1:8080/desktop/ | Bureau noVNC (XFCE) |
| http://127.0.0.1:8080 avec Host: dvwa.lab | DVWA (après config /etc/hosts) |
| http://127.0.0.1:8080 avec Host: api.lab | vuln-api |
| http://127.0.0.1:8080 avec Host: juice.lab | Juice Shop |
| http://127.0.0.1:8080 avec Host: bwapp.lab | bWAPP |

## Depuis l’attaquant (Kali)

Depuis le terminal (http://127.0.0.1:8080/terminal/ ou `make shell`), les **hostnames** suivants sont résolus :

- `vuln-network` (ou `vulnbox`) → cible SSH/Redis
- `vuln-api` (ou `api`) → API (port 5000)
- `dvwa`, `juice-shop`, `bwapp` → cibles web (si tu les appelles par leur nom de service, ex. `curl http://vuln-api:5000`)

Il n’y a **pas** de sous-réseaux ni de VLAN dans ce lab : un seul segment pour garder la configuration simple. Pour des topologies plus complexes (type Packet Tracer), on peut documenter l’usage de GNS3/Eve-NG en complément.
