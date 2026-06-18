# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package*.json ./
RUN npm ci

# Build the SPA. VITE_* vars are inlined at build time, so the API base URL
# must be provided here. Default is the same-origin "/api" path that Nginx
# reverse-proxies to the backend (no CORS in production).
COPY . .
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ── Runtime stage (Nginx serving the SPA + reverse proxy) ────────────────────
FROM nginx:1.27-alpine AS production

# Replace the stock config with our SPA + API-proxy config.
RUN rm /etc/nginx/conf.d/default.conf
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Static assets produced by Vite.
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=10s \
  CMD wget -qO- http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
