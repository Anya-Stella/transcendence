#!/bin/sh

# 証明書が既に存在する場合はスキップ（IPが変わった場合は docker-compose down してから再起動）
if [ -f /etc/nginx/ssl/server.crt ]; then
  echo "[generate-cert] Certificate already exists, skipping."
  exit 0
fi

# SERVER_IP 環境変数が未設定の場合は localhost をデフォルトにする
CERT_IP="${SERVER_IP:-localhost}"

mkdir -p /etc/nginx/ssl

echo "[generate-cert] Generating certificate for IP: ${CERT_IP}"

if [ "$CERT_IP" = "localhost" ]; then
  SAN="DNS:localhost"
else
  SAN="DNS:localhost, IP:${CERT_IP}"
fi

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/server.key \
  -out /etc/nginx/ssl/server.crt \
  -subj "/C=JP/ST=Tokyo/L=Tokyo/O=42Tokyo/CN=${CERT_IP}" \
  -addext "subjectAltName = ${SAN}"

