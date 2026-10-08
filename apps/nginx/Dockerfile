# ==============================================================================
# LearnioX Nginx Ingress Reverse Proxy Dockerfile
# ==============================================================================

FROM nginx:1.25-alpine

# Install curl for container healthchecking
RUN apk add --no-cache curl

# Copy custom Nginx configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

# Create upload directory mount point
RUN mkdir -p /app/uploads

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
