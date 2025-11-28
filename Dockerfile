# ============================
# 1. Builder
# ============================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build


# ============================
# 2. Production
# ============================
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps

# Copy dist output
COPY --from=builder /app/dist ./dist

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3001

CMD ["/entrypoint.sh"]
