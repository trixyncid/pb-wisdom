# syntax=docker/dockerfile:1.7
#
# Production image: dependencies are installed and the app is built with bun,
# then run by Node from Next's standalone output (Next targets Node, and the
# `proxy` runs on the Node runtime). Prisma needs OpenSSL at runtime.

ARG NODE_IMAGE=node:22-bookworm-slim

# ---- bun binary (copied into the Node-based build stages)
FROM oven/bun:1.3.9 AS bun

# ---- local development (docker-compose.yml): built once, the source is
# bind-mounted and `next dev` hot-reloads, so code changes need no rebuild.
FROM ${NODE_IMAGE} AS dev
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
RUN ln -s /usr/local/bin/bun /usr/local/bin/bunx
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

# ---- dependencies
FROM ${NODE_IMAGE} AS deps
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
# postinstall runs `prisma generate`, which needs the schema.
COPY prisma ./prisma
RUN bun install --frozen-lockfile

# ---- build
FROM ${NODE_IMAGE} AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Git SHA of the build; becomes Next's deploymentId (see next.config.ts).
ARG DEPLOYMENT_ID=""
ENV DEPLOYMENT_ID=${DEPLOYMENT_ID} \
    NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# ---- runtime
FROM ${NODE_IMAGE} AS runner
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Prisma CLI for `prisma migrate deploy` (run by the one-shot migrate service).
# Keep the version equal to @prisma/client in package.json.
RUN npm install -g prisma@6.19.3 && npm cache clean --force

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/prisma ./prisma

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
