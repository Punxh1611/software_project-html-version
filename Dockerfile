FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd backend && npm install --production

# Copy all source files
COPY . .

EXPOSE 3000

CMD ["node", "backend/server.js"]
