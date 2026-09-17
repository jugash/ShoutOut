# syntax=docker/dockerfile:1

ARG NODE_IMAGE=docker.io/library/node:22-alpine

# ---- dependencies (includes dev deps for build + prisma generate) ----
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# ---- build the standalone Next.js server ----
FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

# ---- migrations image: prisma CLI only (build with --target migrator) ----
FROM ${NODE_IMAGE} AS migrator
WORKDIR /migrate
COPY package.json /tmp/package.json
RUN npm init -y >/dev/null \
 && npm install --omit=dev --no-audit --no-fund \
      "prisma@$(node -p "require('/tmp/package.json').devDependencies.prisma")" \
      "dotenv@$(node -p "require('/tmp/package.json').devDependencies.dotenv")" \
 && npm cache clean --force
COPY prisma.config.ts ./
COPY prisma ./prisma
USER 1000
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

# ---- runtime (default target) ----
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 shoutout && adduser -S -u 1001 -G shoutout shoutout
COPY --from=build --chown=shoutout:shoutout /app/.next/standalone ./
COPY --from=build --chown=shoutout:shoutout /app/.next/static ./.next/static
COPY --from=build --chown=shoutout:shoutout /app/public ./public
USER 1001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
