# Reprise à 8h — LabCyber

**À faire ce matin :**

---

## 1. Git : commit et push des changements (si pas déjà fait)

```bash
cd /home/pactivisme/Documents/Cyber/LabCyber

git add scripts/gns3a-import.sh Makefile platform/docs/20-EVE-NG-WORKFLOW-TEST.md
git commit -m "gns3a: timeout 120s, détection Docker, timing par appliance, récap EVE doc"
git push origin feature/phase3-conteneur-attaquant
```

---

## 2. Vérifier si make lab-images-gns3a a terminé

Si tu l’avais laissé tourner : il devait finir les 45 .gns3a (windows_server, zentyal, zeroshell en dernier).

```bash
make lab-images-gns3a   # relancer si besoin, ou vérifier les derniers .gns3a
```

---

## 3. EVE-NG — Transférer les images

Tu accèdes à EVE en web (http://127.0.0.1:9080).

**Configurer la clé SSH (une seule fois) :**
```bash
ssh-keygen -t ed25519 -f ~/.ssh/eve-ng -N ""
ssh-copy-id -i ~/.ssh/eve-ng -p 9022 root@127.0.0.1
# mot de passe : eve
```

**Transférer les images vers EVE :**
```bash
EVE_SSH_KEY=~/.ssh/eve-ng make lab-images-transfer-eve-ng
```

---

## 4. Workflow EVE (guide principal)

Document de référence : `platform/docs/20-EVE-NG-WORKFLOW-TEST.md`

1. Ouvrir http://127.0.0.1:9080 (admin / eve)
2. Add new lab
3. Add nodes (images qemu/dynamips/iol)
4. Connect nodes
5. Start all
6. Clic droit → Open console
7. Mots de passe dans `isos/docs/passwords/PASSWORDS-EVE-NG.md`

---

## 5. Résumé des modifs de la veille

- **gns3a-import.sh** : timeout 15s/120s (plus de blocage Brocade), détection appliances Docker
- **Makefile** : timing par appliance + total pour lab-images-gns3a
- **20-EVE-NG-WORKFLOW-TEST.md** : récap clé SSH + transfert à faire quand EVE est ouvert
