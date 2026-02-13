#!/bin/sh
# Génère les défis stégano et crypto pour la plateforme (exécuté dans le Dockerfile ou en local)
set -e
OUT="${1:-.}"
mkdir -p "$OUT/stego" "$OUT/crypto"

# Crypto: Base64
echo -n "LAB_CRYPTO_FLAG_B64_1" | base64 > "$OUT/crypto/flag_b64.txt"

# Crypto: OpenSSL (AES-256-CBC)
echo -n "LAB_CRYPTO_FLAG_ENC_1" > "$OUT/crypto/flag_plain.txt"
openssl enc -aes-256-cbc -salt -in "$OUT/crypto/flag_plain.txt" -out "$OUT/crypto/flag.enc" -k labcrypto
rm -f "$OUT/crypto/flag_plain.txt"

# Stego: steghide supporte JPEG/BMP. ImageMagick crée un JPEG.
if command -v steghide >/dev/null 2>&1 && command -v convert >/dev/null 2>&1; then
  convert -size 400x400 xc:steelblue "$OUT/stego/carrier.jpg"
  echo "LAB_STEGO_FLAG_1" > "$OUT/stego/flag.txt"
  steghide embed -cf "$OUT/stego/carrier.jpg" -ef "$OUT/stego/flag.txt" -p labstego -f -q
  mv "$OUT/stego/carrier.jpg" "$OUT/stego/image_stego.jpg"
  rm -f "$OUT/stego/flag.txt"
fi
echo "Challenges generated in $OUT/stego and $OUT/crypto"
