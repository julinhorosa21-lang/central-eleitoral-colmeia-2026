FROM node:22-slim
WORKDIR /app
ADD central-colmeia-v013.tar.gz /app/
ENV NODE_ENV=production
RUN mkdir -p /app/runtime
EXPOSE 8787
CMD ["node","server.mjs"]
