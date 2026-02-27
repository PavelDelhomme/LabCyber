# Convention de nommage QEMU pour EVE-NG

Ce document décrit la **convention de nommage des images QEMU** dans EVE-NG. Respecter ces règles est **obligatoire** pour que les images soient reconnues.

**Emplacement des images QEMU dans EVE-NG** : `/opt/unetlab/addons/qemu/`

---

## Structure des dossiers

Chaque image doit être dans un **sous-dossier** dont le nom **commence** par le préfixe attendu (colonne ci-dessous). Après le tiret `-`, tu ajoutes le nom et la version de ton image.

### Exemples de noms de dossiers

- `firepower6-FTD-6.2.1`
- `acs-5.8.1.4`
- `linux-ubuntu-20.04-server`
- `asav-9.18.1`

---

## Nom du fichier HDD (.qcow2)

À l’intérieur du dossier de l’image, place le disque virtuel avec le **nom exact** attendu par EVE-NG :

| Préfixe dossier | Fichier attendu |
|-----------------|-----------------|
| Exemple virtio | `virtioa.qcow2` ou `hda.qcow2` |

**Exemple complet** :  
`/opt/unetlab/addons/qemu/acs-5.8.1.4/hda.qcow2`

---

## Formats HDD supportés par EVE-NG

| Format HDD | Exemple |
|------------|---------|
| lsi([a-z]+).qcow2 | lsia.qcow2 |
| hd([a-z]+).qcow2 | hda.qcow2 |
| virtide([a-z]+).qcow2 | virtidea.qcow2 |
| virtio([a-z]+).qcow2 | virtioa.qcow2 |
| scsi([a-z]+).qcow2 | scsia.qcow2 |
| sata([a-z]+).qcow2 | sataa.qcow2 |
| megasas([a-z]+).qcow2 | megasasa.qcow2 |

**Note** : Pour plusieurs disques, la dernière lettre suit l’alphabet : hda, hdb, hdc… ; virtioa, virtiob, virtioc…

---

## Tableau des préfixes QEMU EVE-NG

| Préfixe dossier | Vendor | Nom fichier .qcow2 |
|-----------------|--------|--------------------|
| a10- | A10 vThunder | hda |
| acs- | ACS | hda |
| asa- | ASA ported | hda |
| asav- | ASAv | virtioa |
| ampcloud- | Ampcloud Private | hda, hdb, hdc |
| alteon- | Radware | virtioa |
| barracuda- | Barracuda FW | hda |
| bigip- | F5 | virtioa, virtiob |
| brocadevadx- | Brocade | virtioa |
| cda- | Cisco CDA | hda |
| cips- | Cisco IPS | hda, hdb |
| clearpass- | Aruba ClearPass | hda, hdb |
| aruba- | Aruba Virtual Mobility Controller | hda, hdb |
| arubacx- | Aruba CX Switch | virtioa |
| coeus- | Cisco WSA coeus | virtioa |
| phoebe- | Cisco ESA | virtioa |
| cpsg- | Checkpoint | hda |
| csr1000v- | Cisco CSR v1000 3.x | virtioa |
| csr1000vng- | Cisco CSR v1000 16.x, 17.x | virtioa |
| prime- | Cisco Prime Infra | virtioa |
| cucm- | Cisco CUCM | virtioa |
| cumulus- | Cumulus | virtioa |
| extremexos- | ExtremeOS | sataa |
| esxi- | VMware ESXi | hda, hdb, hdc… |
| firepower- | Cisco FirePower 5.4 NGIPS/FMC | scsia |
| firepower6- | Cisco FirePower 6.x NGIPS/FMC/FTD | sataa / virtioa |
| fortinet- | Fortinet FW/SGT/mail/manager | virtioa (, virtiob) |
| hpvsr- | HP virt router | hda |
| huaweiar1k- | Huawei AR1000v | virtioa |
| huaweiusg6kv- | Huawei USG6000v | hda |
| ise- | Cisco ISE 1.x / 2.x | hda / virtioa |
| jspace- | Junos Space | virtioa |
| infoblox- | Infoblox | virtioa |
| junipervrr- | Juniper vRR | virtioa |
| kerio- | Kerio Control Firewall | sataa |
| linux- | any linux | virtioa |
| mikrotik- | MikroTik router | hda |
| nsvpx- | Citrix Netscaler | virtioa |
| nsx- | VMware NSX | hda |
| nxosv9k- | NX9K Cisco Nexus | sataa |
| olive- | Juniper | hda |
| ostinato- | Ostinato traffic generator | hda |
| osx- | Apple OSX | hda + kernel.img |
| paloalto- | PaloAlto FW | virtioa |
| panorama- | PaloAlto Panorama | virtioa, virtiob |
| pfsense- | pfSense FW | virtioa |
| pulse- | Pulse Secure | virtioa |
| riverbed- | Riverbed | virtioa, virtiob |
| scrutinizer- | Plixer Scrutinizer Netflow | virtioa |
| silveredge- | Silver Peak Edge | hda |
| silverorch- | Silver Peak Orchestrator | hda |
| sonicwall- | FW Sonicwall | sataa |
| sourcefire- | Sourcefire NGIPS | scsia |
| sterra- | S-terra VPN / Gate | hda / virtioa |
| stealth- | Cisco StealthWatch | hda |
| timos- | Alcatel Lucent Timos | hda |
| timoscpm- | Nokia Timos 19 | virtidea |
| timosiom- | Nokia Timos 19 | virtidea |
| titanium- | NXOS Titanium Cisco | virtioa |
| vcenter- | VMware vCenter | sataa…satam |
| veos- | Arista SW | hda, cdrom.iso |
| veloedge- | Velocloud Edge | virtioa |
| velogw- | Velocloud Gateway | virtioa |
| veloorch- | Velocloud Orchestrator | virtioa, virtiob, virtioc |
| versaana- | Versa Networks Analyzer | virtioa |
| versadir- | Versa Networks Director | virtioa |
| versavnf- | Versa Networks FlexVNF Edge | virtioa |
| vios- | L3 vIOS Cisco Router | virtioa |
| viosl2- | L2 vIOS Cisco SW | virtioa |
| vtbond- | Viptela vBond | virtioa |
| vtedge- | Viptela vEdge | virtioa |
| vtsmart- | Viptela vSmart | virtioa |
| vtmgmt- | Viptela vManage | virtioa, virtiob |
| vmx- | Juniper vMX router | hda |
| vmxvcp- | Juniper vMX-VCP | virtioa, virtiob, virtioc |
| vmxvfp- | Juniper vMX-VFP | virtioa |
| vnam- | Cisco VNAM | hda |
| vqfxpfe- | Juniper vQFX-PFE | hda |
| vqfxre- | Juniper vQFX-RE | hda |
| vsrx- | vSRX 12.1 Juniper FW/router | virtioa |
| vsrxng- | vSRX v15.x Juniper FW/router | virtioa |
| vwaas- | Cisco WAAS | virtioa, virtiob, virtioc |
| vwlc- | vWLC Cisco WiFi controller | megasasa |
| vyos- | VYOS | virtioa |
| win- | Windows Hosts (non Server) | hda ou virtioa |
| winserver- | Windows Server | hda ou virtioa |
| xrv- | XRv Cisco router | hda |
| xrv9k- | XRv 9000 Cisco router | virtioa |

---

## Liens utiles — Images et mots de passe

| Ressource | URL |
|-----------|-----|
| **Images et mots de passe EVE-NG** | [Cisco Images for GNS3 and EVE-NG](https://github.com/hegdepavankumar/Cisco-Images-for-GNS3-and-EVE-NG) |
| **PDF Mots de passe (Pavankumar Hegde)** | [EVE-NG and GNS3 Images Passwords.pdf](https://github.com/hegdepavankumar/Cisco-Images-for-GNS3-and-EVE-NG/blob/main/EVE-NG%20and%20GNS3%20Images%20Passwords%20by%20Pavankumar%20Hegde.pdf) |
| **QEMU Image Namings (repo)** | [QEMU-Image-Namings.md](https://github.com/hegdepavankumar/Cisco-Images-for-GNS3-and-EVE-NG/blob/main/QEMU-Image-Namings.md) |
| **Appliances GNS3 officielles** | [GNS3 server appliances](https://github.com/GNS3/gns3-server/tree/master/gns3server/appliances) |

---

## Mots de passe courants (indications)

Les identifiants par défaut varient selon le vendor. Référence : PDF *EVE-NG and GNS3 Images Passwords* (voir liens ci-dessus). Exemples **courants** :

| Type | Login | Password |
|------|-------|----------|
| Cisco IPS | cisco | ciscoips123 |
| IronPort / Cisco ESA | admin | ironport ou default |
| Divers | admin | Admin123, Test123, eve4cisco |
| Divers | root | root, root123, default |
| Juniper | super | juniper123 |
| Divers | admin | abc123 |
| Setup | setup | setup |

**Important** : Consulter le PDF ou `platform/data/eve-ng-passwords.json` pour les identifiants précis par image.

---

*Source : documentation EVE-NG, [hegdepavankumar/Cisco-Images-for-GNS3-and-EVE-NG](https://github.com/hegdepavankumar/Cisco-Images-for-GNS3-and-EVE-NG).*
