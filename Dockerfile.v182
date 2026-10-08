FROM node:22-slim AS builder
WORKDIR /app

ADD central-colmeia-v020.tar.gz /app/

RUN apt-get update \
 && apt-get install -y --no-install-recommends unzip ca-certificates qrencode python3 python3-venv python3-pip git \
 && rm -rf /var/lib/apt/lists/*

# Verificador criptográfico do QR-BU conforme o Manual TSE 2026.
RUN python3 -m venv /opt/ce184-venv \
 && /opt/ce184-venv/bin/pip install --no-cache-dir --upgrade pip \
 && /opt/ce184-venv/bin/pip install --no-cache-dir \
      "asn1tools>=0.167.0" \
      "asn1crypto>=1.5.1" \
      "git+https://github.com/cslashm/ECPy.git@8143d9ac017de0cb7f980bedaf56cefe6b4d9180" \
 && /opt/ce184-venv/bin/python -c "import asn1tools; from ecpy.curves import Curve; assert Curve.get_curve('Ed521') is not None; assert Curve.get_curve('secp521r1') is not None"

ENV CE184_PYTHON=/opt/ce184-venv/bin/python

COPY . /src
RUN chmod +x /src/v182-build.sh \
 && /src/v182-build.sh \
 && rm -rf /src

FROM node:22-slim AS runtime
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends python3-minimal ca-certificates unzip \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/ce184-venv /opt/ce184-venv
COPY --from=builder /app /app

ENV NODE_ENV=production \
    CE184_PYTHON=/opt/ce184-venv/bin/python

RUN mkdir -p /app/runtime /data
LABEL org.opencontainers.image.title="Central Eleitoral Colmeia 2026" \
      org.opencontainers.image.version="2.1.7"
EXPOSE 8787
CMD ["node","server.mjs"]
