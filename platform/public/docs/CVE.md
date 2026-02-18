# CVE : fonctionnement, utilisation et détection

Ce document décrit comment fonctionnent les **CVE** (Common Vulnerabilities and Exposures), comment les utiliser en pentest ou en veille, et comment détecter les vulnérabilités associées dans le lab.

## Fonctionnement des CVE

- **Définition** : un CVE est un identifiant unique pour une vulnérabilité publique (logicielle ou matérielle). Format : `CVE-ANNÉE-NUMÉRO` (ex. CVE-2024-1234).
- **Contenu** : le CVE décrit généralement le logiciel concerné, les versions affectées, le type de vulnérabilité (injection, RCE, XSS, etc.) et des références (avis du fournisseur, correctifs).
- **Attribution** : les CNA (CVE Numbering Authorities) attribuent les identifiants. NVD (NIST) enrichit les CVE avec des métadonnées (CPE, score CVSS, correctifs).
- **Où consulter** : [NVD](https://nvd.nist.gov/vuln/search), [CVE.mitre.org](https://cve.mitre.org/). Dans la plateforme Lab Cyber, le **bouton CVE** (en haut) ouvre le panneau CVE : **recherche par ID** (ouvrir un CVE sur NVD) et **recherche par mot-clé** (logiciel, OS, application, version) via l’API NVD 2.0 ; les résultats s’affichent dans l’interface avec résumé, score CVSS et lien vers NVD.

## Utilisation des CVE

1. **Recherche** : sur NVD, recherche par nom de produit (ex. Redis, OpenSSH), par CVE-ID, ou par mot-clé.
2. **Lecture** : résumé, versions affectées (CPE), score CVSS (gravité), références et correctifs.
3. **En pentest** : vérifier si les versions des services du lab sont concernées (nmap -sV, banners), croiser avec NVD, documenter les CVE dans le rapport.
4. **Veille** : suivre les CVE pour les produits que tu déploies ou que tu audites.

## Détection des vulnérabilités (CVE)

- **Scan de versions** : identifier les logiciels et versions (nmap -sV, affichage des bannières). Ensuite, rechercher manuellement sur NVD les CVE pour ces versions.
- **Outils dédiés** :  
  - **Nmap** : scripts NSE de la catégorie `vuln` (ex. `nmap --script vuln <cible>`).  
  - **Trivy, Grype** : scan de vulnérabilités (conteneurs, dépendances, SBOM).  
  - **OpenVAS, Nessus** : scanners complets (hors lab, à titre informatif).
- **Dans le lab** : utilise le terminal attaquant pour lancer nmap, vérifier les versions des services (vuln-network, vuln-api, etc.), puis utilise le bouton CVE ou NVD pour retrouver les CVE associés.

## Défi challenge

Le challenge **« CVE : rechercher une vulnérabilité »** (progression) consiste à : utiliser le bouton CVE (recherche par mot-clé ou par ID), afficher les détails dans l’interface ou sur NVD, trouver un CVE pour un logiciel (ex. Redis, OpenSSH), et noter son ID, le produit et le score CVSS.

## Liens utiles

- [NVD – Recherche](https://nvd.nist.gov/vuln/search)
- [CVE.mitre.org](https://cve.mitre.org/)
- [CVSS v3.1 Calculator](https://www.first.org/cvss/calculator/3.1)
- Doc & Cours → thème **CVE & Vulnérabilités** dans la plateforme pour le détail (fonctionnement, utilisation, détection).
