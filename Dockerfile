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
ENV NODE_ENV=production
RUN mkdir -p /app/runtime
EXPOSE 8787
CMD ["node","server.mjs"]
