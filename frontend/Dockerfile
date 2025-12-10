# =============================================================================
# MCM Totem - Multi-stage Docker Build
# =============================================================================
# Build arguments (VITE_*) are injected at build time and baked into the JS bundle.
# In production, pass these via GitHub Secrets in your CI/CD workflow.
#
# Example GitHub Actions usage:
#   docker build \
#     --build-arg VITE_TOTEM_USERNAME="${{ secrets.VITE_TOTEM_USERNAME }}" \
#     --build-arg VITE_TOTEM_PASSWORD="${{ secrets.VITE_TOTEM_PASSWORD }}" \
#     --build-arg VITE_TOTEM_EMPRESA="${{ secrets.VITE_TOTEM_EMPRESA }}" \
#     -f frontend/Dockerfile .
# =============================================================================

# Stage 1: Builder
FROM node:24-alpine AS builder

# Enable corepack for yarn support
RUN corepack enable

WORKDIR /app

# Copy workspace root files first (for better cache layer)
COPY package.json yarn.lock ./

# Copy frontend package.json
COPY frontend/package.json ./frontend/

# Install dependencies with frozen lockfile
RUN yarn install --frozen-lockfile --network-timeout 100000

# Copy frontend source code
COPY frontend/ ./frontend/

# -----------------------------------------------------------------------------
# Build arguments for VITE_* variables
# These are injected at build time and become part of the JavaScript bundle.
# For production, use GitHub Secrets to pass these values securely.
# -----------------------------------------------------------------------------

# API Configuration (can use defaults)
ARG VITE_API_BASE_URL=https://gestaosaude.mcinfor-saude.net.br
ARG VITE_API_TIMEOUT_MS=10000

# Authentication - REQUIRED for production (no defaults for security)
ARG VITE_TOTEM_USERNAME
ARG VITE_TOTEM_PASSWORD
ARG VITE_TOTEM_EMPRESA

# Optional: Panel WebSocket URL
ARG VITE_PANEL_WS_URL

# Set environment variables for Vite build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_TIMEOUT_MS=${VITE_API_TIMEOUT_MS}
ENV VITE_TOTEM_USERNAME=${VITE_TOTEM_USERNAME}
ENV VITE_TOTEM_PASSWORD=${VITE_TOTEM_PASSWORD}
ENV VITE_TOTEM_EMPRESA=${VITE_TOTEM_EMPRESA}
ENV VITE_PANEL_WS_URL=${VITE_PANEL_WS_URL}

# Build the application
WORKDIR /app/frontend
RUN yarn build

# =============================================================================
# Stage 2: Production (nginx)
# =============================================================================
FROM nginx:alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Set permissions for nginx user (already exists in nginx:alpine)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/nginx.conf && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user (security best practice)
USER nginx

# Expose port 8080 (non-privileged port for non-root user)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
