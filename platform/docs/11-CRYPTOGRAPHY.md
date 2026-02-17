# Cryptographie – Chiffrement, hachage, encodage

## Objectifs

- Distinguer **chiffrement**, **hachage** et **encodage** (Base64, etc.).
- Utiliser **OpenSSL**, **GPG** pour chiffrer/déchiffrer.
- Identifier et casser des **schémas faibles** (César, Vigenère, hash non salé).
- Pratiquer avec des **défis** (fichiers fournis sur la plateforme).

## Principes rapides

- **Encodage** (Base64, hex) : réversible sans clé – pas de sécurité, juste représentation.
- **Hachage** (MD5, SHA1, SHA256) : non réversible ; on compare des hash ou on brute-force (rainbow tables, John, hashcat).
- **Chiffrement** (AES, RSA, GPG) : réversible avec la clé ou le mot de passe.

## Outils dans le lab (conteneur attaquant)

| Outil | Usage |
|-------|--------|
| **openssl** | Chiffrement symétrique (enc -aes-256-cbc), base64, hash (md5, sha256). |
| **gpg** | Chiffrement asymétrique / symétrique, déchiffrer des .gpg. |
| **base64** | Décoder / encoder Base64. |
| **john** / **hashcat** | Casser des mots de passe (hash) – John est inclus. |
| **python3** | Scripts pour César, Vigenère, XOR, etc. |

## Commandes utiles

```bash
# Base64
echo "TGFCX0NSWVBUXzE=" | base64 -d

# Hash (vérifier)
echo -n "secret" | openssl md5
echo -n "secret" | openssl sha256

# OpenSSL – déchiffrer un fichier (mot de passe demandé)
openssl enc -d -aes-256-cbc -in flag.enc -out flag.txt

# GPG – déchiffrer
gpg -d flag.gpg
```

## Défis sur la plateforme

La **plateforme web** propose des défis cryptographie (fichiers .enc, .gpg, messages encodés) dans la section **Cryptographie**, avec objectifs et tips. Les flags sont au format `LAB_CRYPTO_xxx` ou indiqués dans la room.

## Types de défis courants

- **Base64 / hex** : décoder pour obtenir le flag.
- **Chiffrement symétrique** (OpenSSL) : retrouver le mot de passe (wordlist, indice).
- **GPG** : fichier chiffré avec un mot de passe.
- **Hash** : identifier le type (MD5, SHA1…) puis casser avec John ou une table.
- **Substitution** : César, ROT13, Vigenère – script Python ou outils en ligne.

## Tips

- Toujours identifier le type : `file`, regarder le header (Base64 commence par des caractères alphanumériques + /+=).
- Pour OpenSSL enc : le mot de passe est souvent court en CTF (password, secret, flag).
- John the Ripper : `john --format=raw-md5 hashes.txt` (après préparation du fichier hash).

## Références

- [OpenSSL enc](https://www.openssl.org/docs/man1.1.1/man1/enc.html)
- [GPG](https://gnupg.org/)
