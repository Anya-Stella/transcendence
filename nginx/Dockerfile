FROM nginx:alpine
RUN apk add --no-cache openssl
COPY generate-cert.sh /docker-entrypoint.d/10-generate-cert.sh
RUN chmod +x /docker-entrypoint.d/10-generate-cert.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 443
