FROM nginx:1.25-alpine

# Copy custom Nginx configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

# Create upload directory mount point
RUN mkdir -p /app/uploads

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
