# Machine attaquant : Kali Linux (outils pentest) + backend terminal maison (lab-terminal) dans le même conteneur.
# Le panneau terminal (terminal-house) utilise lab-terminal → shell = Kali (nmap, tcpdump, sqlmap, etc.).
# Build depuis la racine du repo : docker build -f attacker/Dockerfile .

# Stage 1 : compiler lab-terminal (Go)
FROM golang:1.21-alpine AS lab-terminal-builder
WORKDIR /build
RUN apk add --no-cache gcc musl-dev
COPY lab-terminal/ .
RUN go mod download 2>/dev/null || true && CGO_ENABLED=1 go build -o /lab-terminal .

# Stage 2 : Kali + ttyd + lab-terminal
FROM kalilinux/kali-rolling

LABEL org.labcyber.phase3.packs="base,network,web,bruteforce,osint"

ENV DEBIAN_FRONTEND=noninteractive

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

RUN pip3 install --no-cache-dir --break-system-packages \
    requests \
    theharvester \
    scapy \
    2>/dev/null || true

# ttyd (terminal web alternatif)
ARG TTYD_VERSION=1.7.4
RUN arch=$(dpkg --print-architecture) && \
    case "$arch" in amd64) suf="x86_64";; arm64) suf="aarch64";; *) suf="";; esac && \
    if [ -n "$suf" ]; then \
      wget -q -O /usr/local/bin/ttyd "https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.${suf}" && \
      chmod +x /usr/local/bin/ttyd && [ -x /usr/local/bin/ttyd ] || (echo "ttyd install failed for $arch" && exit 1); \
    fi

# Backend terminal maison (PTY + WebSocket) : même conteneur = shell Kali
COPY --from=lab-terminal-builder /lab-terminal /usr/local/bin/lab-terminal

WORKDIR /workspace
RUN echo "base,network,web,bruteforce,osint" > /workspace/phase3-packs.txt

RUN echo 'echo "=== Lab Cyber – Attaquant (Kali) ==="' >> /root/.bashrc && \
    echo 'echo "Cibles: vuln-network, vuln-api, dvwa, juice-shop, bwapp"' >> /root/.bashrc && \
    echo 'echo "nmap, tcpdump, sqlmap, etc. disponibles."' >> /root/.bashrc

RUN mkdir -p /root/.lab_bash_history && \
    echo 'export HISTFILE="/root/.lab_bash_history/history"' >> /root/.bashrc && \
    echo 'export HISTSIZE=5000' >> /root/.bashrc && \
    echo 'export HISTFILESIZE=10000' >> /root/.bashrc && \
    echo 'export PROMPT_COMMAND="${PROMPT_COMMAND:+$PROMPT_COMMAND; }history -a"' >> /root/.bashrc

EXPOSE 7681 7682
ENV PORT=7682
# lab-terminal sur 7682 (panneau terminal-house), ttyd sur 7681 (fallback)
CMD ["/bin/sh", "-c", "lab-terminal & exec ttyd -p 7681 -i 0.0.0.0 -W bash"]