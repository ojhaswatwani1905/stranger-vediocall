FROM node:20-slim AS builder

WORKDIR /app

# Copy server package definitions
COPY package*.json ./
RUN npm ci

# Copy server source code and compile TypeScript
COPY . .
RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000
EXPOSE 40000-49999/udp

CMD ["node", "dist/server.js"]

