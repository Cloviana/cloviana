# syntax=docker/dockerfile:1

####### 1) Base stage: common bits (Node, pnpm/corepack, working dir) #######
FROM node:20-alpine AS base
RUN apk add --no-cache openssl \
 && npm install -g corepack
WORKDIR /app

####### 2) Deps stage: install all deps (yarn, npm or pnpm) #######
FROM base AS deps
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then \
    yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  elif [ -f pnpm-lock.yaml ]; then \
    pnpm install; \
  else \
    echo "⚠️  No lockfile, installing latest"; yarn install; \
  fi

####### 3) Builder stage: compile & export standalone #######
FROM deps AS builder
# Ensure optimized build
ENV NODE_ENV=production

# Build-time vars for your Next.js client
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Bake into process.env for the build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    NEXT_PUBLIC_ENVIRONMENT=production

# Copy everything (we already got lockfiles & .npmrc)
COPY . .

# Run the Next.js build
RUN \
  if [ -f yarn.lock ]; then \
    yarn build; \
  elif [ -f package-lock.json ]; then \
    npm run build; \
  elif [ -f pnpm-lock.yaml ]; then \
    pnpm build; \
  else \
    npm run build; \
  fi

####### 4) Dev stage: hot-reload container #######
FROM deps AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD \
  if [ -f yarn.lock ]; then \
    yarn dev; \
  elif [ -f package-lock.json ]; then \
    npm run dev; \
  elif [ -f pnpm-lock.yaml ]; then \
    pnpm dev; \
  else \
    npm run dev; \
  fi

####### 5) Runner stage: ultra-small production image #######
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app

# Ensure runtime is production
ENV NODE_ENV=production

# Copy only the standalone build and static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app
ENV NEXT_CACHE_DIR=/app/.next/cache

# Re-expose your runtime ENVs if needed (e.g. for server-side code)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    NEXT_PUBLIC_ENVIRONMENT=production

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
