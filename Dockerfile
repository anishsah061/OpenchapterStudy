# Use Node 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package files (if any) - Optional if we handle subfolders manually
# COPY package*.json ./

# --- CLIENT BUILD ---
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- SERVER SETUP ---
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --legacy-peer-deps
COPY server/ ./

# --- FINAL SETUP ---
# Move back to root (optional, but good for clarity)
WORKDIR /app

# Expose the port (Railway will set PORT env var, usually random)
ENV PORT=8000
EXPOSE 8000

# Start the server
CMD ["node", "server/server.js"]
