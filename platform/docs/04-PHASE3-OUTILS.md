# Phase 3 – Outils et packs (attaquant riche)

Ce document décrit la cible Phase 3 du système maison : **packs d’outils** et **prédéfinitions** à la création du lab / au démarrage d’un scénario.

## Objectifs

- **Conteneur attaquant** : conserver ou étendre la base type Kali ; **outils de base** + **packs d’outils** (sélectionnables).
- **Prédéfinitions** : à la création d’un lab ou au démarrage d’un scénario, les outils/packs **nécessaires** sont indiqués par la config et, à terme, installés ou activés.
- **Backend terminal** : le shell du terminal lab tourne dans ce conteneur attaquant (déjà le cas aujourd’hui).

## Fichiers de configuration (squelette)

- **`platform/data/toolPacks.json`** : liste des **packs** (id, name, description, tools). Chaque pack regroupe des outils pour un type d’activité (réseau, web, bruteforce, etc.).
- **`platform/data/labToolPresets.json`** : **prédéfinitions** :
  - `byScenario` : pour chaque `scenarioId`, liste de `packId` recommandés ou requis.
  - `byLab` : pour chaque lab (optionnel), liste de packs à activer.

L’app peut charger ces JSON pour afficher quels packs sont associés à un scénario ; l’**installation effective** des outils dans le conteneur (script d’init, Dockerfile, ou service dédié) reste à implémenter.

## Suite prévue

1. **UI** : dans la vue Lab ou Scénario, afficher les packs recommandés pour le scénario actif (lecture de `labToolPresets.json` + `toolPacks.json`).
2. **Installation** : au démarrage du lab ou au lancement d’un scénario, exécuter un script ou un service qui installe les paquets du pack (ex. `apt-get install -y nmap tcpdump` pour le pack `network`). À trancher : conteneur pré-construit avec tous les packs vs. installation à la demande.
3. **Sélection de packs** : à la création d’un lab, permettre de choisir les packs à inclure (optionnel).

## Référence

- Roadmap : [docs/ROADMAP-SYSTEME-MAISON.md](../../docs/ROADMAP-SYSTEME-MAISON.md) – Phase 3.
- STATUS : section « Système maison », Phase 3 en cours.
