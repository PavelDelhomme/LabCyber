# Machine attaquant : Kali Linux (outils pentest, sniffing, spoofing, forensique)
# Pour scénarios type TryHackMe / HackTheBox : nmap, hydra, sqlmap, tcpdump, scapy, etc.

FROM kalilinux/kali-rolling

ENV DEBIAN_FRONTEND=noninteractive

# Mise à jour et outils essentiels (éviter kali-linux-headless = très lourd)
RUN apt-get update && apt-get install -y --no-install-recommends \
    nmap \
    netcat-openbsd \
    curl \
    wget \
    dnsutils \
    iputils-ping \
    hydra \
    nikto \
    sqlmap \
    gobuster \
    tcpdump \
    tshark \
    redis-tools \
    openssh-client \
    python3 \
    python3-pip \
    python3-venv \
    steghide \
    exiftool \
    binwalk \
    openssl \
    gnupg \
    vim-tiny \
    file \
    less \
    ca-certificates \
    git \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Outils Python : recon, requêtes, construction de paquets (sniffing / spoofing)
RUN pip3 install --no-cache-dir --break-system-packages \
    requests \
    theharvester \
    scapy \
    2>/dev/null || true

# Terminal web (ttyd) – binaires directs
ARG TTYD_VERSION=1.7.4
RUN arch=$(dpkg --print-architecture) && \
    case "$arch" in amd64) suf="x86_64";; arm64) suf="aarch64";; *) suf="";; esac && \
    if [ -n "$suf" ]; then \
      wget -q -O /usr/local/bin/ttyd "https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.${suf}" && \
      chmod +x /usr/local/bin/ttyd && [ -x /usr/local/bin/ttyd ] || (echo "ttyd install failed for $arch" && exit 1); \
    fi

WORKDIR /workspace

# Rappel : cibles du lab (vuln-network, vuln-api, dvwa, juice-shop, bwapp)
RUN echo 'echo "=== Lab Cyber – Attaquant (Kali) ==="' >> /root/.bashrc && \
    echo 'echo "Cibles: vuln-network (SSH/Redis), vuln-api (API), dvwa, juice-shop, bwapp"' >> /root/.bashrc && \
    echo 'echo "Ex: nmap -sV vuln-network | tcpdump -i any -w cap.pcap | scapy"' >> /root/.bashrc

# Persistance de l'historique bash : commandes conservées entre rechargements et nouvelles sessions
RUN mkdir -p /root/.lab_bash_history && \
    echo 'export HISTFILE="/root/.lab_bash_history/history"' >> /root/.bashrc && \
    echo 'export HISTSIZE=5000' >> /root/.bashrc && \
    echo 'export HISTFILESIZE=10000' >> /root/.bashrc && \
    echo 'export PROMPT_COMMAND="${PROMPT_COMMAND:+$PROMPT_COMMAND; }history -a"' >> /root/.bashrc

EXPOSE 7681
CMD ["/bin/sh", "-c", "if [ -x /usr/local/bin/ttyd ]; then exec ttyd -p 7681 -i 0.0.0.0 -W bash; else sleep infinity; fi"]
