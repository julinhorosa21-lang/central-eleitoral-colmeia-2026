FROM node:22-slim
WORKDIR /app
ADD central-colmeia-v020.tar.gz /app/
COPY transparencia-v021.html /app/public/transparencia.html
COPY v021-main.js /app/public/v021-main.js
COPY v021-patch.mjs /app/v021-patch.mjs
RUN node /app/v021-patch.mjs && rm /app/v021-patch.mjs
COPY v022-visual.css /app/public/v022-visual.css
COPY v022-main.js /app/public/v022-main.js
COPY service-worker-v022.js /app/public/service-worker.js
COPY v022-patch.mjs /app/v022-patch.mjs
RUN node /app/v022-patch.mjs && rm /app/v022-patch.mjs
COPY v0221-civic.css /app/public/v0221-civic.css
COPY v0221-civic.js /app/public/v0221-civic.js
COPY service-worker-v0221.js /app/public/service-worker.js
COPY v0221-patch.mjs /app/v0221-patch.mjs
RUN node /app/v0221-patch.mjs && rm /app/v0221-patch.mjs
COPY v0222-contrast.css /app/public/v0222-contrast.css
COPY service-worker-v0222.js /app/public/service-worker.js
COPY contrast-audit-v0222.mjs /app/contrast-audit-v0222.mjs
RUN node /app/contrast-audit-v0222.mjs && rm /app/contrast-audit-v0222.mjs
COPY v0222-patch.mjs /app/v0222-patch.mjs
RUN node /app/v0222-patch.mjs && rm /app/v0222-patch.mjs
COPY seguranca-v023.html /app/public/seguranca.html
COPY v023-main.js /app/public/v023-main.js
COPY service-worker-v023.js /app/public/service-worker.js
COPY v023-patch.mjs /app/v023-patch.mjs
RUN node /app/v023-patch.mjs && rm /app/v023-patch.mjs
COPY v023-preflight.mjs /app/v023-preflight.mjs
RUN node --check /app/server.mjs && node /app/v023-preflight.mjs && rm /app/v023-preflight.mjs
COPY simulacao-v024.html /app/public/simulacao.html
COPY v024-main.js /app/public/v024-main.js
COPY service-worker-v024.js /app/public/service-worker.js
COPY v024-patch.mjs /app/v024-patch.mjs
RUN node /app/v024-patch.mjs && rm /app/v024-patch.mjs
COPY v024-preflight.mjs /app/v024-preflight.mjs
RUN node --check /app/server.mjs && node /app/v024-preflight.mjs && rm /app/v024-preflight.mjs
RUN apt-get update && apt-get install -y --no-install-recommends unzip ca-certificates && rm -rf /var/lib/apt/lists/*
COPY v0241-assets.mjs /app/v0241-assets.mjs
RUN node /app/v0241-assets.mjs && rm /app/v0241-assets.mjs
COPY v0241-photos.css /app/public/v0241-photos.css
COPY v0241-photos.js /app/public/v0241-photos.js
COPY service-worker-v0241.js /app/public/service-worker.js
COPY v0241-patch.mjs /app/v0241-patch.mjs
RUN node /app/v0241-patch.mjs && rm /app/v0241-patch.mjs
COPY v0241-preflight.mjs /app/v0241-preflight.mjs
RUN node --check /app/server.mjs && node --check /app/public/v0241-photos.js && node /app/v0241-preflight.mjs && rm /app/v0241-preflight.mjs
COPY v100-main.js /app/public/v100-main.js
COPY service-worker-v100.js /app/public/service-worker.js
COPY v100-patch.mjs /app/v100-patch.mjs
RUN node /app/v100-patch.mjs && rm /app/v100-patch.mjs
COPY v100-preflight.mjs /app/v100-preflight.mjs
COPY contrast-audit-v0222.mjs /app/contrast-audit-v100.mjs
RUN node --check /app/server.mjs \
 && node --check /app/public/v0241-photos.js \
 && node --check /app/public/v100-main.js \
 && node --check /app/public/service-worker.js \
 && node /app/v100-preflight.mjs \
 && node /app/contrast-audit-v100.mjs \
 && rm /app/v100-preflight.mjs /app/contrast-audit-v100.mjs
COPY v102-candidates.js /app/public/v102-candidates.js
COPY v102-main.js /app/public/v102-main.js
COPY service-worker-v102.js /app/public/service-worker.js
COPY v102-patch.mjs /app/v102-patch.mjs
RUN node /app/v102-patch.mjs && rm /app/v102-patch.mjs
COPY v102-preflight.mjs /app/v102-preflight.mjs
RUN node --check /app/server.mjs \
 && node --check /app/public/v102-candidates.js \
 && node --check /app/public/v102-main.js \
 && node --check /app/public/service-worker.js \
 && node /app/v102-preflight.mjs \
 && rm /app/v102-preflight.mjs
COPY ensaio-v110.html /app/public/ensaio.html
COPY v110-main.js /app/public/v110-main.js
COPY service-worker-v110.js /app/public/service-worker.js
COPY v110-patch.mjs /app/v110-patch.mjs
RUN node /app/v110-patch.mjs && rm /app/v110-patch.mjs
COPY v110-preflight.mjs /app/v110-preflight.mjs
RUN node --check /app/server.mjs \
 && node --check /app/public/v110-main.js \
 && node --check /app/public/service-worker.js \
 && node /app/v110-preflight.mjs \
 && rm /app/v110-preflight.mjs
COPY v111-cleanup.css /app/public/v111-cleanup.css
COPY v111-main.js /app/public/v111-main.js
COPY service-worker-v111.js /app/public/service-worker.js
COPY v111-patch.mjs /app/v111-patch.mjs
RUN node /app/v111-patch.mjs && rm /app/v111-patch.mjs
COPY v111-map-points.mjs /app/v111-map-points.mjs
RUN node /app/v111-map-points.mjs && rm /app/v111-map-points.mjs
COPY v111-preflight.mjs /app/v111-preflight.mjs
RUN node --check /app/server.mjs \
 && node --check /app/public/v111-main.js \
 && node --check /app/public/service-worker.js \
 && node /app/v111-preflight.mjs \
 && rm /app/v111-preflight.mjs
COPY v121-polish.css /app/public/v121-polish.css
COPY v121-polish.js /app/public/v121-polish.js
COPY service-worker-v121.js /app/public/service-worker.js
COPY v121-patch.mjs /app/v121-patch.mjs
RUN node /app/v121-patch.mjs && rm /app/v121-patch.mjs
COPY v121-preflight.mjs /app/v121-preflight.mjs
RUN node --check /app/public/v121-polish.js \
 && node --check /app/public/service-worker.js \
 && node /app/v121-preflight.mjs \
 && rm /app/v121-preflight.mjs
LABEL org.opencontainers.image.title="Central Eleitoral Colmeia 2026" \
      org.opencontainers.image.version="1.1.1"
ENV NODE_ENV=production
RUN mkdir -p /app/runtime
EXPOSE 8787
CMD ["node","server.mjs"]
