# OSINT – Renseignement en sources ouvertes

## Objectifs

- Utiliser des **sources ouvertes** pour la reconnaissance (domaines, emails, infos publiques).
- S’entraîner de façon **légale et éthique** (cibler uniquement ce que vous êtes autorisé à tester).

## Outils dans le lab (conteneur attaquant)

- **theHarvester** : collecte d’emails, sous-domaines, hôtes à partir de moteurs de recherche et d’APIs.
- **curl / wget** : requêtes HTTP, téléchargement de pages.
- **whois / dig / nslookup** : DNS, WHOIS (depuis la machine hôte si besoin).

En dehors du lab : Maltego, Shodan, Censys, Google dorks, etc.

## Exercices OSINT (éthiques)

Dans ce lab, les “cibles” sont locales (hostnames Docker). Pour pratiquer l’OSINT sans cibler de vrais tiers :

- [ ] **theHarvester** sur un **domaine que vous contrôlez** (votre site, votre domaine perso) :  
  `theHarvester -d votredomaine.fr -b bing,google`
- [ ] **DNS** : utiliser `dig` / `nslookup` sur les hostnames du lab (dvwa, juice-shop, vuln-network) depuis le conteneur (résolution interne).
- [ ] **Reconnaissance “interne”** : depuis l’attaquant, lister les hôtes et services (nmap, nikto) et rédiger une fiche “recon” comme en pentest.

## Bonnes pratiques

- Ne pas cibler des domaines ou des organisations sans **autorisation explicite**.
- Utiliser l’OSINT pour : préparation de pentest, exercices sur vos propres assets, CTF, formations.
