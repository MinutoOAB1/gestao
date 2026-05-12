# ============================================
# Backend Dockerfile - NestJS + Prisma
# ============================================

# --- Stage 1: Build ---
FROM node:22-slim AS builder

WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files for better caching
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install all dependencies with legacy-peer-deps
RUN npm install --legacy-peer-deps

# Generate Prisma Client
RUN npx prisma generate --schema=prisma/schema.prisma

# Copy the rest of the source code
COPY . .

# Build the NestJS application
RUN npm run build

# --- Stage 2: Production ---
FROM node:22-slim AS runner

WORKDIR /app

# Install OpenSSL (required by Prisma at runtime)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy Prisma schema
COPY prisma ./prisma/

# Re-generate Prisma Client for production
RUN npx prisma generate --schema=prisma/schema.prisma

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => { process.exit(r.statusCode === 200 || r.statusCode === 404 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the server
CMD ["node", "dist/src/main.js"]
