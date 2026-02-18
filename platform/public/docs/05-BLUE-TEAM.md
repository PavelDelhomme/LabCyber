# Blue Team – Détection et réponse à incident (solo)

## Objectifs

- **Détecter** des comportements suspects (trafic, logs).
- **Analyser** des captures trafic (pcap) avec Suricata.
- Mettre en œuvre une **réponse à incident** simple (analyse, rapport).

## Composant Blue Team dans le lab

- **Suricata** (IDS) : conteneur `blue-suricata`, profil `blue`.
- Utilisation principale : **analyse de fichiers pcap** (trafic enregistré) pour s’entraîner à la détection.

### Démarrer le profil Blue

```bash
docker compose --profile blue up -d
docker compose exec blue-suricata sh
# Dans le conteneur : déposer des pcaps dans /workspace (volume sur l’hôte)
suricata -r /workspace/capture.pcap -l /var/log/suricata
# Puis analyser les alertes dans /var/log/suricata/eve.json
```

### Générer du trafic à analyser

1. Lancer le lab et le conteneur attaquant.
2. Depuis l’attaquant : lancer des scans (nmap, nikto) ou des exploitations (sqlmap, hydra) vers les cibles.
3. Sur la **machine hôte**, capturer le trafic (Wireshark, tcpdump) vers/depuis les conteneurs, ou utiliser `tcpdump` dans un conteneur en écoute sur l’interface.
4. Copier le pcap dans le volume `suricata-pcaps` (ou monter un dossier partagé) pour l’analyser avec Suricata.

## Tests à réaliser (checklist)

- [ ] Démarrer le profil `blue` et lancer une analyse Suricata sur un pcap.
- [ ] Capturer du trafic pendant des scans (nmap) et des requêtes web (nikto, curl).
- [ ] Lire les alertes Suricata (eve.json) et identifier des événements suspects (scan, tentative d’exploit).
- [ ] Rédiger une fiche “incident” : type d’événement, preuve (log ou alerte), recommandation.

## Analyse des logs (généraux)

- **DVWA, bWAPP, vuln-api** : logs applicatifs (si activés dans les images) – à consulter pour corréler avec des attaques.
- **Conteneur attaquant** : pas de log central par défaut ; la “preuve” côté Blue Team vient des **captures** et de **Suricata**.

## Réponse à incident (solo)

1. **Identification** : quelle cible, quel service, quel type d’attaque (scan, SQLi, brute force) ?
2. **Containment** : dans le lab, “isoler” = documenter et éventuellement arrêter le conteneur cible pour analyse.
3. **Éradication** : renforcer la config (ex : mot de passe Redis, correction SQLi) – à faire en refaisant les images ou en documentant les correctifs.
4. **Récupération** : redémarrer les services après “correctif”.
5. **Leçons apprises** : court rapport (ce qui a été détecté, ce qui aurait pu être évité).

## Aller plus loin (hors lab Docker)

- **Wazuh** : installer un manager Wazuh + agents sur des VMs pour centraliser les logs et les alertes.
- **Elastic SIEM** : stack Elasticsearch + Kibana + règles de détection pour corréler événements.
