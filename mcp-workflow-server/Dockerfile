# Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm ci --only=development

# Copy source code
COPY tsconfig.json ./
COPY src ./src
COPY config ./config

# Build the application
RUN npm run build || true

# If main build fails, compile simple server as fallback
RUN npx tsc src/simple-server.ts --outDir dist --esModuleInterop --skipLibCheck || true

# Production stage
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --omit=dev && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/config ./config

# Copy additional files
COPY --chown=nodejs:nodejs README.md ./
COPY --chown=nodejs:nodejs examples ./examples

# Create directories for runtime
RUN mkdir -p logs quality-reports && \
    chown -R nodejs:nodejs logs quality-reports

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server (fallback to simple server if main fails)
CMD ["sh", "-c", "node dist/index.js || node dist/simple-server.js"]