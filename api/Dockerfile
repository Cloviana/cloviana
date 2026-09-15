FROM node:22-bookworm-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl procps \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm
# pnpm's default store path is derived from $PNPM_HOME. Without this, it
# resolves to /root/.local/share/pnpm/store, which doesn't line up with the
# cache mount's target below, so the mount was never actually caching anything.
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch

FROM dependencies AS dev
ENV NODE_ENV=development
ENV ENVIRONMENT=development
# Only the Prisma schema is copied: db:generate needs it, and its output lands
# in node_modules, which the named volume seeds from this image. The rest of the
# source is bind-mounted by compose-dev.yaml, so copying it here would just be
# shadowed at runtime and would invalidate this layer on every edit.
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --offline --frozen-lockfile
RUN pnpm exec playwright install --with-deps chromium
RUN pnpm db:generate
EXPOSE 5000
CMD ["pnpm", "start:dev"]

FROM dependencies AS builder
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --offline --frozen-lockfile
RUN pnpm exec playwright install --with-deps chromium
RUN pnpm db:generate
RUN pnpm build

FROM builder AS pruned
RUN pnpm prune --prod

FROM node:22-bookworm-slim AS runner
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV ENVIRONMENT=production
WORKDIR /app
COPY --from=pruned /app/package.json .  
COPY --from=pruned /app/node_modules ./node_modules
COPY --from=pruned /app/dist ./dist
COPY --from=pruned /app/prisma ./prisma
COPY --from=builder /root/.cache/ms-playwright /root/.cache/ms-playwright
RUN ./node_modules/.bin/playwright install-deps chromium \
    && rm -rf /var/lib/apt/lists/*
EXPOSE 5000
CMD ["node", "dist/main.js"]
