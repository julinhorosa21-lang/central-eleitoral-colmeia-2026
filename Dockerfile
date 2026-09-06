FROM # V0.20
WORKDIR /app
ADD central-colmeia-v020.tar.gz /app/
ENV NODE_ENV=production
RUN mkdir -p /app/runtime
EXPOSE 8787
CMD ["node","server.mjs"]
