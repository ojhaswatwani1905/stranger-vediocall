FROM node:20-slim AS builder

# Install build dependencies required by mediasoup
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy server package definitions
COPY package*.json ./
RUN npm ci

# Copy server source code and compile TypeScript
COPY . .
RUN npm run build

FROM node:20-slim AS runner

# Install runtime dependencies for mediasoup
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000
EXPOSE 40000-49999/udp

CMD ["node", "dist/server.js"]


