FROM node:20-alpine AS builder

# Install build dependencies for mediasoup C++ worker compilation
RUN apk add --no-cache python3 make g++ git linux-headers

WORKDIR /app/server

# Copy server package definitions
COPY package*.json ./
RUN npm ci

# Copy server source code and compile TypeScript
COPY . ./
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache python3

WORKDIR /app/server
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/package*.json ./

EXPOSE 3000
EXPOSE 40000-49999/udp

CMD ["node", "dist/server.js"]
