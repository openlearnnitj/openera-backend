# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    openssl \
    ca-certificates

# Copy package files and prisma first
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma/ ./prisma/

# Install ALL dependencies first (including dev dependencies for build)
RUN npm install

# Generate Prisma client (needs to happen after prisma folder is copied)
RUN npx prisma generate

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Build the application (needs dev dependencies)
RUN npm run build

# Remove dev dependencies after build to keep image small
RUN npm prune --omit=dev

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S openera -u 1001

# Create logs directory and set permissions
RUN mkdir -p logs && chown -R openera:nodejs /app
USER openera

# Expose port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:10000/ping', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# Start the application
CMD ["npm", "start"]
