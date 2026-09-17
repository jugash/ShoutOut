# syntax=docker/dockerfile:1

ARG NODE_IMAGE=docker.io/library/node:22-alpine

# ---- dependencies (includes dev deps for the build) ----
FROM ${NODE_IMAGE} AS deps
LABEL org.shoutout.build="true"
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build the standalone Next.js server ----
FROM deps AS build
LABEL org.shoutout.build="true"
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

# ---- hardened Node base: patched OS packages, no npm/yarn/corepack at runtime ----
FROM ${NODE_IMAGE} AS base
LABEL org.shoutout.build="true"
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

# ---- runtime ----
FROM base AS runner
LABEL org.shoutout.build="true"
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 shoutout && adduser -S -u 1001 -G shoutout shoutout
COPY --from=build --chown=shoutout:shoutout /app/.next/standalone ./
COPY --from=build --chown=shoutout:shoutout /app/.next/static ./.next/static
COPY --from=build --chown=shoutout:shoutout /app/public ./public
# SQL migrations and their runner (node db/migrate.mjs), which uses the app's `pg`.
COPY --from=build --chown=shoutout:shoutout /app/db ./db
USER 1001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
