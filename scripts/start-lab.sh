#!/usr/bin/env bash
# Démarre le lab cyber (build + up)
set -e
cd "$(dirname "$0")/.."
echo "Build et démarrage du lab..."
docker compose build --no-cache attaquant 2>/dev/null || true
docker compose up -d
echo ""
echo "Lab démarré. Voir: docker compose ps"
echo "Connexion au conteneur attaquant: docker compose exec attaquant bash"
echo "Documentation: docs/GETTING_STARTED.md"
