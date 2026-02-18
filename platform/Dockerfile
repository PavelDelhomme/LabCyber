# Stage 1: défis stégano + crypto
FROM debian:bookworm-slim AS challenges
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl steghide imagemagick ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY platform/build-challenges.sh .
RUN chmod +x build-challenges.sh && ./build-challenges.sh /challenges

# Stage 2: build app Preact/Vite (seule application web)
FROM node:20-alpine AS app
WORKDIR /app
COPY platform/package*.json ./
RUN npm ci
COPY platform/ ./
# Build : public/ est copié dans dist/ par Vite (donc dist/docs = public/docs, dist/data = public/data)
RUN npm run build

# Stage 3: servir avec nginx
FROM nginx:alpine
COPY --from=challenges /challenges /usr/share/nginx/html/challenges
COPY --from=app /app/dist /usr/share/nginx/html
COPY --from=app /app/dist/data /usr/share/nginx/html/data
COPY --from=app /app/dist/docs /usr/share/nginx/html/docs
COPY platform/demo-phishing.html platform/test-logs.html /usr/share/nginx/html/
COPY platform/nginx-default.conf /etc/nginx/conf.d/default.conf
RUN chown -R nginx:nginx /usr/share/nginx/html/challenges 2>/dev/null || true
EXPOSE 80
