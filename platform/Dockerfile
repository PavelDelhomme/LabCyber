# Stage 1: générer les défis (stégano + crypto)
FROM debian:bookworm-slim AS challenges
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    steghide \
    imagemagick \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY platform/build-challenges.sh .
RUN chmod +x build-challenges.sh && ./build-challenges.sh /challenges

# Stage 2: servir la plateforme avec nginx (contexte build = racine du repo)
FROM nginx:alpine
# Contenu statique
COPY --from=challenges /challenges /usr/share/nginx/html/challenges
COPY platform/nginx-default.conf /etc/nginx/conf.d/default.conf
COPY platform/index.html platform/demo-phishing.html /usr/share/nginx/html/
COPY platform/css /usr/share/nginx/html/css
COPY platform/js /usr/share/nginx/html/js
COPY platform/data /usr/share/nginx/html/data
COPY docs /usr/share/nginx/html/docs
# Permettre le téléchargement des fichiers dans challenges/
RUN chown -R nginx:nginx /usr/share/nginx/html/challenges 2>/dev/null || true
EXPOSE 80
