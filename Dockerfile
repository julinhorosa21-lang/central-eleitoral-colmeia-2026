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
ENV NODE_ENV=production
RUN mkdir -p /app/runtime
EXPOSE 8787
CMD ["node","server.mjs"]
