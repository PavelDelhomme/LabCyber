# Cibles et scénarios à faire (backlog)

Ce document liste les **cibles** (machines, services) et **thèmes de scénarios** prévus pour le lab mais pas encore implémentés. À intégrer dans : `docs/ROADMAP-SYSTEME-MAISON.md`, `platform/public/data/targets.json`, `platform/public/data/scenarios.json`, `platform/public/data/challenges.json`, `platform/docs/`, et les services (vuln-network, vuln-api, nouveaux conteneurs).

---

## Cibles machines / services à ajouter

- **Windows Server** : machine cible Windows Server (ex. 2019/2022) pour scénarios AD, GPO, services Windows.
- **Active Directory (AD)** : contrôleur de domaine, LDAP/Kerberos, utilisateurs, GPO – scénarios Kerberoasting, Golden Ticket, DCShadow, etc.
- **DHCP** : service DHCP (sur vuln-network ou machine dédiée) pour scénarios réseau (rogue DHCP, énumération).
- **Autres cibles envisagées** : DNS interne, SMB (partages), RDP, services métier sur Windows.

---

## Où mettre à jour

| Lieu | Action |
|------|--------|
| **docs/ROADMAP-SYSTEME-MAISON.md** | Backlog « Cibles : Windows Server, AD, DHCP ». |
| **platform/docs/** | Ce fichier (05-CIBLES-A-FAIRE.md) ; références dans 04-PHASE3-OUTILS.md si besoin. |
| **platform/public/data/targets.json** | Entrées `planned` ou section « À venir » (Windows Server, AD, DHCP) quand les services existent. |
| **platform/public/data/scenarios.json** | Nouveaux scénarios (ex. Kerberoasting, énum AD, rogue DHCP) quand cibles prêtes. |
| **platform/public/data/challenges.json** | Défis liés AD / Windows / DHCP. |
| **platform/public/docs** | Fiches ou liens doc pour les nouvelles cibles. |
| **platform/src/** | Aucun changement tant que les cibles ne sont pas dans `targets.json` / config. |
| **vuln-network** | Optionnel : ajout DHCP, ou doc « à faire ». |
| **vuln-api** | Garder tel quel ; pas de lien direct AD/DHCP. |
| **Nouveaux conteneurs** | À prévoir : image Windows Server (ou VM), conteneur AD (ex. goad, ou manuel). |

---

## Référence

- Roadmap : [docs/ROADMAP-SYSTEME-MAISON.md](../../docs/ROADMAP-SYSTEME-MAISON.md) – backlog et Phase 3.
- Cibles actuelles : [platform/public/data/targets.json](../public/data/targets.json).
