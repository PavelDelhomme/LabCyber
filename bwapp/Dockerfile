# Image bWAPP avec config Supervisord qui supprime les CRIT/WARN (auth, user explicite)
FROM raesene/bwapp:latest

# Remplacer la config par défaut : auth sur unix_http_server, user=root explicite
COPY supervisord.conf /etc/supervisor/supervisord.conf

# L'image garde son ENTRYPOINT/CMD (ex. /run.sh) qui lance MySQL puis supervisord.
# Au démarrage, supervisord lira /etc/supervisor/supervisord.conf (chemin par défaut Debian).
