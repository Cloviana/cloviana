# syntax=docker/dockerfile:1

FROM node:22-bookworm AS base
WORKDIR /app
RUN corepack enable
# pnpm's default store path is derived from $PNPM_HOME. Setting it explicitly
# gives the cache mount below a fixed target to persist across builds instead
# of re-downloading the whole dependency tree on every lockfile change.
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"

FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN --mount=type=cache,id=pnpm-web,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS builder
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_WEB_URL
ARG NEXT_PUBLIC_GA4_ID
ARG NEXT_PUBLIC_CLARITY_PROJECT_ID
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_WEB_URL=${NEXT_PUBLIC_WEB_URL} \
    NEXT_PUBLIC_ENVIRONMENT=production \
    NEXT_PUBLIC_GA4_ID=${NEXT_PUBLIC_GA4_ID} \
    NEXT_PUBLIC_CLARITY_PROJECT_ID=${NEXT_PUBLIC_CLARITY_PROJECT_ID}
COPY . .
RUN pnpm build

FROM deps AS dev
WORKDIR /app
ENV NODE_ENV=development
# No COPY of the source here on purpose: compose-dev.yaml bind-mounts ../web
# over /app, so anything copied in would be shadowed at runtime anyway. Leaving
# it out keeps this stage cache-valid across source edits — it only rebuilds
# when the lockfile changes. This image is not runnable without that mount.
EXPOSE 3000
CMD [ "pnpm", "exec", "next", "dev", "-H", "0.0.0.0", "-p", "3000" ]

FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN useradd -m nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
