FROM node:20-alpine

# Install FFmpeg for video processing
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source files
COPY . .

# Create necessary directories for storage
RUN mkdir -p uploads videos thumbnails avatars

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

CMD ["npm", "start"]
