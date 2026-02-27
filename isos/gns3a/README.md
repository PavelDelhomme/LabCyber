# Fichiers GNS3 appliance (.gns3a)

Place ici tes fichiers `.gns3a` (téléchargés depuis le [GNS3 Marketplace](https://www.gns3.com/marketplace/appliances) ou fournis par ton admin).

**Télécharger** depuis [GNS3 server](https://github.com/GNS3/gns3-server) : `make lab-images-gns3-server`

**Import** : lance `make lab-images-gns3a` pour importer tous les .gns3a de ce dossier vers `isos/lab-images/` (qemu, dynamips, iol).

Les images dont l’URL est dans le fichier seront téléchargées automatiquement. Celles sans URL devront être placées manuellement dans `isos/lab-images/` selon le type.
