# Frontend (React) production image — Ex4.
# Two stages keep the final image tiny (only static files + nginx):
#   1) build   — compile the Create-React-App bundle with Node.
#   2) runtime — serve the static bundle with nginx, reverse-proxying the API
#                and image requests to the Node web server (compose service `web`).
# Build context is ./frontend (see docker-compose.yml), so all paths below are
# relative to the frontend/ directory.

# ---- Stage 1: build the static React bundle ----
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first so this layer is cached unless the manifests change.
# `npm ci` is reproducible from package-lock.json.
COPY package*.json ./
RUN npm ci

# Copy the rest of the source and produce an optimized production build.
COPY . ./
RUN npm run build

# ---- Stage 2: serve the bundle with nginx ----
FROM nginx:1.27-alpine

# SPA fallback + API/image reverse-proxy configuration.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ship only the compiled static assets from the build stage.
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
