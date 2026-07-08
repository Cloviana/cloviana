FROM node:20-bookworm-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl procps \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch

FROM dependencies AS dev
ENV NODE_ENV=development
ENV ENVIRONMENT=development
COPY . .
RUN pnpm install --offline
RUN pnpm db:generate
EXPOSE 5000
CMD ["pnpm", "start"]

FROM dependencies AS builder
COPY . .
RUN pnpm install --offline
RUN pnpm exec playwright install --with-deps chromium
RUN pnpm db:generate
RUN pnpm build

FROM builder AS pruned
RUN pnpm prune --prod

FROM node:20-bookworm-slim AS runner
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
