FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN npm install -g pnpm
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch

FROM dependencies AS builder
COPY prisma ./prisma
RUN pnpm install --offline
RUN pnpm db:generate
COPY . .
RUN pnpm build

FROM builder AS dev
ENV NODE_ENV=development
WORKDIR /app
EXPOSE 5000
CMD ["pnpm", "start:debug"]

FROM builder AS pruned
RUN pnpm prune --prod

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /app
COPY --from=pruned /app/package.json .  
COPY --from=pruned /app/node_modules ./node_modules
COPY --from=pruned /app/dist ./dist
COPY --from=pruned /app/prisma ./prisma
EXPOSE 5000
CMD ["node", "dist/main.js"]
