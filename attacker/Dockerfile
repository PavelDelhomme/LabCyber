# Image attaquant : outils de test d'intrusion / pentest
# Environnement isolé pour le lab - basé sur Debian

FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    # Réseau et scan
    nmap \
    netcat-openbsd \
    iputils-ping \
    curl \
    wget \
    # Web / exploitation
    nikto \
    sqlmap \
    # Python pour scripts
    python3 \
    python3-pip \
    # Utilitaires
    vim-tiny \
    less \
    ca-certificates \
    dnsutils \
    && rm -rf /var/lib/apt/lists/*

# Outils Python utiles (optionnel)
RUN pip3 install --no-cache-dir --break-system-packages \
    requests \
    2>/dev/null || true

WORKDIR /workspace

# Message au démarrage
RUN echo 'echo "Lab Cyber - Conteneur attaquant. Ex: nmap -sV dvwa, nikto -h http://dvwa"' >> /root/.bashrc

CMD ["bash"]
