# Conteneur attaquant : Red Team, pentest, forensique, OSINT, Blue Team (analyse)
# Couvre Web, Réseau, App, exploitation, détection

FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

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

WORKDIR /workspace

# Rappel des catégories et commandes utiles
RUN echo 'echo "=== Lab Cyber - Web, Réseau, App, Red/Blue, Forensique, OSINT, Stégano, Crypto ==="' >> /root/.bashrc && \
    echo 'echo "Ex: nmap -sV vuln-network | steghide extract -sf image.jpg | openssl enc -d -aes-256-cbc -in f.enc"' >> /root/.bashrc

CMD ["bash"]
