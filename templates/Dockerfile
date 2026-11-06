# The sandbox every theme runs in, for local Docker and for the Daytona snapshot. Build context: this folder.
# Dependencies and the dev server's compile cache are baked in so a new sandbox skips the install.
# After changing this file or the template's lockfile, run api/scripts/publish-sandbox-snapshot.ts.
FROM node:22-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends git python3 curl chromium && rm -rf /var/lib/apt/lists/*
# Keep in step with OPENCODE_VERSION; the API refuses to build this image if they differ.
RUN npm install -g opencode-ai@1.19.5
RUN mkdir -p /home/daytona/cloviana/project && chown -R node:node /home/daytona

USER node
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /home/daytona/cloviana/project

COPY --chown=node:node marketplace-default/ ./
RUN npm ci --no-audit --no-fund && cp package-lock.json node_modules/.cloviana-lock

# Compiling the template's pages once leaves a cache the first real preview can reuse.
RUN (npx next dev --hostname 127.0.0.1 --port 3000 & \
     for attempt in $(seq 1 90); do curl -sf -o /dev/null http://127.0.0.1:3000/ && break; sleep 1; done; \
     curl -s -o /dev/null http://127.0.0.1:3000/cart; sleep 5; pkill -TERM -f "next" ; sleep 2) || true

# Theme source comes from the revision snapshot. Only the install and the cache stay.
RUN find . -mindepth 1 -maxdepth 1 ! -name node_modules ! -name .next -exec rm -rf {} +

WORKDIR /home/daytona/cloviana
CMD ["sleep", "infinity"]
