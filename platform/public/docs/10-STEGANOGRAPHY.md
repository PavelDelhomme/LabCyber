# Stéganographie – Cacher des données dans des fichiers

## Objectifs

- Comprendre la **stéganographie** (données cachées dans images, audio, etc.).
- Utiliser les **outils** : steghide, stegseek, exiftool, binwalk, strings, xxd.
- Résoudre des **défis** type CTF (extraire un flag).

## Principes

La stéganographie consiste à **dissimuler** une information dans un support innocent (image, fichier audio, PDF). En cybersécurité et en CTF, on doit souvent :
- Détecter qu’un fichier contient des données cachées.
- Extraire ces données (avec ou sans mot de passe).

## Outils dans le lab (conteneur attaquant)

| Outil | Usage |
|-------|--------|
| **steghide** | Cacher / extraire des données dans des JPEG (mot de passe optionnel). |
| **stegseek** | Brute-force rapide sur fichiers steghide (rockyou, etc.). |
| **exiftool** | Lire les métadonnées (EXIF) des images – parfois le flag est là. |
| **binwalk** | Détecter et extraire des fichiers embarqués (images, archives). |
| **strings** | Afficher les chaînes imprimables – flag en clair dans le binaire. |
| **xxd** | Hexdump – voir le contenu brut. |
| **file** | Identifier le type réel d’un fichier (pas seulement l’extension). |

## Workflow type

1. **Identifier le fichier** : `file image.jpg`
2. **Métadonnées** : `exiftool image.jpg`
3. **Recherche de fichiers embarqués** : `binwalk image.jpg` puis `binwalk -e image.jpg`
4. **Steghide** : `steghide info image.jpg` puis `steghide extract -sf image.jpg`
5. **Chaînes** : `strings image.jpg | grep -i flag`

## Défis sur la plateforme

La **plateforme web** du lab propose des défis stéganographie dans la section **Stéganographie** : images et fichiers à télécharger, avec explications et tips. Les flags sont au format `LAB_STEGO_xxx` ou indiqués dans la room.

## Tips

- Toujours commencer par `file` et `exiftool` – rapide et souvent suffisant.
- Un fichier “.jpg” peut être en réalité un ZIP ou une archive : renommer en .zip et ouvrir.
- Pour steghide : mots de passe courants en CTF : vide, `password`, `secret`, nom du défi.
- **stegseek** avec une wordlist (ex: rockyou) peut casser un mot de passe steghide rapidement.

## Références

- [Steghide](https://steghide.sourceforge.io/)
- [Stegseek](https://github.com/RickdeJager/stegseek)
