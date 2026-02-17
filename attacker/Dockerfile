# Conteneur attaquant : Red Team, pentest, forensique, OSINT, Blue Team (analyse)
# Couvre Web, Réseau, App, exploitation, détection

FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

# nikto est dans non-free (Debian)
RUN echo "deb http://deb.debian.org/debian bookworm non-free" >> /etc/apt/sources.list

RUN apt-get update && apt-get install -y --no-install-recommends \
    # --- Réseau & scan ---
    nmap \
    netcat-openbsd \
    iputils-ping \
    curl \
    wget \
    dnsutils \
    tcpdump \
    redis-tools \
    # --- Web / exploitation ---
    nikto \
    sqlmap \
    gobuster \
    dirb \
    # --- Brute force & cracking ---
    hydra \
    john \
    # --- Python & scripts ---
    python3 \
    python3-pip \
    python3-venv \
    # --- Analyse trafic / forensique (light) ---
    tshark \
    # --- Stéganographie ---
    steghide \
    exiftool \
    binwalk \
    # --- Cryptographie ---
    openssl \
    gnupg \
    # --- Utilitaires ---
    vim-tiny \
    file \
    less \
    ca-certificates \
    git \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Outils Python : requêtes, recon
RUN pip3 install --no-cache-dir --break-system-packages \
    requests \
    theharvester \
    2>/dev/null || true

# Terminal web (ttyd) – optionnel, pour interface web
ARG TTYD_VERSION=1.7.4
RUN arch=$(dpkg --print-architecture) && \
    ( [ "$arch" = "amd64" ] && wget -q -O /tmp/ttyd.tar.gz "https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.${TTYD_VERSION}.x86_64.tar.gz" || true ) && \
    ( [ -f /tmp/ttyd.tar.gz ] && tar -xzf /tmp/ttyd.tar.gz -C /tmp && cp /tmp/ttyd*/ttyd /usr/local/bin/ttyd 2>/dev/null || cp /tmp/ttyd /usr/local/bin/ 2>/dev/null; chmod +x /usr/local/bin/ttyd 2>/dev/null; rm -rf /tmp/ttyd* ) || true

WORKDIR /workspace

# Rappel des catégories et commandes utiles
RUN echo 'echo "=== Lab Cyber - Web, Réseau, App, Red/Blue, Forensique, OSINT, Stégano, Crypto ==="' >> /root/.bashrc && \
    echo 'echo "Ex: nmap -sV vuln-network | steghide extract -sf image.jpg | openssl enc -d -aes-256-cbc -in f.enc"' >> /root/.bashrc

# Démarrer ttyd si présent (port 7681), sinon garder le conteneur avec sleep pour docker exec
EXPOSE 7681
CMD ["/bin/sh", "-c", "if [ -x /usr/local/bin/ttyd ]; then exec ttyd -p 7681 -i 0.0.0.0 bash; else sleep infinity; fi"]
