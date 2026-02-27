FROM nginx:alpine
RUN apk add --no-cache openssl && \
    openssl req -x509 -nodes -subj "/CN=lab.local/O=LabCyber" \
      -addext "subjectAltName=DNS:localhost,DNS:lab.local,DNS:eve-ng.lab,IP:127.0.0.1" \
      -days 3650 -newkey rsa:2048 \
      -keyout /etc/ssl/private/labcyber-selfsigned.key \
      -out /etc/ssl/certs/labcyber-selfsigned.crt \
    && apk del openssl
RUN rm -f /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
