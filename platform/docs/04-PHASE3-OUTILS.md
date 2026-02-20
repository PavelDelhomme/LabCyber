# Phase 3 – Outils et packs (attaquant riche)

Ce document décrit la cible Phase 3 du système maison : **packs d’outils** et **prédéfinitions** à la création du lab / au démarrage d’un scénario.

## Objectifs

- **Conteneur attaquant** : conserver ou étendre la base type Kali ; **outils de base** + **packs d’outils** (sélectionnables).
- **Prédéfinitions** : à la création d’un lab ou au démarrage d’un scénario, les outils/packs **nécessaires** sont indiqués par la config et, à terme, installés ou activés.
- **Backend terminal** : le shell du terminal lab tourne dans ce conteneur attaquant (déjà le cas aujourd’hui).

## Fichiers de configuration

- **`platform/data/toolPacks.json`** (et copie dans **`platform/public/data/`** pour être servi) : liste des **packs** avec `id`, `name`, `description`, `tools[]`. Packs disponibles : `base`, `network`, `web`, `bruteforce`, `osint`.
- **`platform/data/labToolPresets.json`** (et **`public/data/`**) : **prédéfinitions** :
  - **`byScenario`** : pour chaque `scenarioId` (ex. `scenario-01-scan-reseau`), liste de `packId` recommandés.
  - **`byLab`** : pour chaque lab (optionnel), liste de packs à activer.

**Important** : garder les deux emplacements synchronisés (`data/` et `public/data/`) car le build Vite sert le contenu de `public/`.

### Ajouter un pack

1. Dans `toolPacks.json`, ajouter un objet dans `packs` : `{ "id": "mon-pack", "name": "Mon pack", "description": "...", "tools": ["outil1", "outil2"] }`.
2. Copier la même modification dans `public/data/toolPacks.json`.

### Associer un scénario aux packs

1. Dans `labToolPresets.json`, ajouter une entrée dans `byScenario` avec l’**id exact** du scénario (voir `scenarios.json`) : `"scenario-XX-nom": ["base", "network", "web"]`.
2. Copier dans `public/data/labToolPresets.json`.
3. Si tu ajoutes un nouveau scénario dans `scenarios.json`, pense à l’ajouter dans `byScenario` avec au moins le pack `base`.

## Ce qui est fait

- **Config** : `toolPacks.json` (packs base, network, web, bruteforce, osint) et `labToolPresets.json` avec tous les scénarios dans `byScenario`. Fichiers dans `data/` et `public/data/`.
- **UI** : dans la vue Scénario, bloc « Packs d'outils recommandés pour ce scénario » (nom du pack + aperçu des outils).

- **Conteneur attaquant opérationnel** : l'image `attacker/` (Kali) est **pré-construite avec tous les packs** (base, network, web, bruteforce, osint). Les outils correspondants sont installés dans le Dockerfile (nmap, hydra, sqlmap, tcpdump, scapy, nikto, gobuster, theHarvester, etc.). Label Docker `org.labcyber.phase3.packs` et fichier `/workspace/phase3-packs.txt` pour référence. **Tous les scénarios** de `labToolPresets.byScenario` sont donc utilisables sans installation à la demande.

## Suite prévue

1. **Sélection de packs** (optionnel) : à la création d'un lab, permettre de choisir les packs à inclure ; aujourd'hui une seule image « tout-en-un » pour simplifier les tests.
2. **Installation à la demande** (optionnel, long terme) : image minimale + script d'installation des packs au démarrage du scénario, si on souhaite alléger l'image.
2. **Sélection de packs** : à la création d’un lab, permettre de choisir les packs à inclure (optionnel).

## Référence

- Roadmap : [docs/ROADMAP-SYSTEME-MAISON.md](../../docs/ROADMAP-SYSTEME-MAISON.md) – Phase 3.
- STATUS : section « Système maison », Phase 3 en cours.
