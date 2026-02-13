# Cible "réseau" : services volontairement vulnérables pour pentest réseau
# SSH (mot de passe faible), Redis (sans auth)

FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssh-server \
    redis-server \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# SSH : autoriser root par mot de passe (lab uniquement)
RUN mkdir -p /run/sshd \
    && sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config \
    && sed -i 's/#PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config \
    && echo 'root:labpassword' | chpasswd

# Redis : écouter sur toutes les interfaces, pas de mot de passe
RUN sed -i 's/^bind.*/bind 0.0.0.0/' /etc/redis/redis.conf 2>/dev/null || true \
    ; sed -i 's/^# bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf 2>/dev/null || true

EXPOSE 22 6379

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
