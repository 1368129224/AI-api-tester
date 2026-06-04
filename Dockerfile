# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server files and the built frontend from the builder stage
COPY server.js ./
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=55443

# Expose the port
EXPOSE 55443

# Start the server
CMD ["npm", "start"]