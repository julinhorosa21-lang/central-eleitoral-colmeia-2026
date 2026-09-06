FROM node:22-slim
WORKDIR /app
ADD central-colmeia-v020.tar.gz /app/
COPY transparencia-v021.html /app/public/transparencia.html
COPY v021-main.js /app/public/v021-main.js
COPY v021-patch.mjs /app/v021-patch.mjs
RUN node /app/v021-patch.mjs && rm /app/v021-patch.mjs
ENV NODE_ENV=production
RUN mkdir -p /app/runtime
EXPOSE 8787
CMD ["node","server.mjs"]
