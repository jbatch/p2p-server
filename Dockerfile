# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only necessary files for build
COPY package.json yarn.lock tsconfig*.json ./
COPY src ./src

# Install dependencies, build, and clean up cache in one layer
RUN yarn install --frozen-lockfile && \
    yarn build && \
    yarn cache clean && \
    rm -rf /usr/local/share/.cache/yarn && \
    rm -rf node_modules

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Set default environment variables
ENV NODE_ENV=production \
    PORT=3001 \
    CORS_ORIGIN="*" \
    LOG_LEVEL="info" \
    MAX_ROOMS="1000" \
    ROOM_TIMEOUT_MS="3600000"

# Copy package files
COPY package.json yarn.lock ./

# Install production dependencies and clean up in one layer
RUN yarn install --production --frozen-lockfile --network-timeout 100000 && \
    yarn cache clean && \
    rm -rf /usr/local/share/.cache/yarn

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user
RUN addgroup -S nodejs && \
    adduser -S nodeuser -G nodejs && \
    chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Expose the port
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD wget -q --spider http://localhost:${PORT}/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]