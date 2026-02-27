# Docker Deployment Guide for SecTube

This guide covers how to run SecTube using Docker and Docker Compose.

## Prerequisites

- Docker 24.0+
- Docker Compose 2.0+
- At least 4GB RAM available for containers
- At least 20GB disk space for videos and database

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.docker .env
```

**IMPORTANT:** Edit `.env` and set at minimum:
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `FRONTEND_URL` - Your production domain (e.g., `https://sectube.com`)

### 2. Build and Run

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### 3. Access the Application

- **Frontend:** http://localhost
- **Backend API:** http://localhost:5000
- **MongoDB:** localhost:27017

## Architecture

### Services

1. **Frontend** (Nginx + React)
   - Multi-stage build: Node.js build → Nginx serve
   - Nginx proxies `/api`, `/videos`, `/thumbnails`, `/avatars` to backend
   - Serves static React SPA
   - Port: 80 (configurable via `FRONTEND_PORT`)

2. **Backend** (Node.js + Express)
   - Runs as non-root user `nodejs` for security
   - FFmpeg pre-installed for video processing
   - Persistent volumes for uploads, videos, thumbnails, avatars
   - Port: 5000 (configurable via `BACKEND_PORT`)

3. **MongoDB**
   - Official MongoDB image
   - Health checks enabled
   - Persistent volume for database
   - Port: 27017 (configurable via `MONGODB_PORT`)

### Network

All services communicate via a private bridge network `sectube-network`.

### Volumes

Persistent data is stored in Docker volumes:
- `backend-uploads` - Temporary video uploads during processing
- `backend-videos` - Processed video files (multiple qualities)
- `backend-thumbnails` - Video thumbnails
- `backend-avatars` - User avatar images
- `mongodb-data` - MongoDB database files

## Configuration

### Environment Variables

All environment variables are defined in `.env` file. See `.env.docker` for a complete template.

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT signing | Generate with `openssl rand -base64 32` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://mongodb:27017/sectube` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost` or `https://yourdomain.com` |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key for emails | - |
| `SMTP_HOST` | SMTP server for emails | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features | - |
| `MAX_VIDEO_SIZE` | Max video upload size (bytes) | `5368709120` (5GB) |
| `VIDEO_QUALITIES` | Video transcode qualities | `360p,480p,720p,1080p` |

### Build Arguments

The frontend accepts build-time arguments:

| Argument | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | API URL used by frontend | `/api` |

## Common Commands

### Start Services

```bash
# Start in detached mode
docker-compose up -d

# Start and rebuild images
docker-compose up -d --build

# Start specific service
docker-compose up -d backend
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Execute Commands in Containers

```bash
# Backend shell
docker-compose exec backend sh

# MongoDB shell
docker-compose exec mongodb mongosh sectube

# Run backend migrations (if any)
docker-compose exec backend npm run migrate
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### View Container Status

```bash
docker-compose ps
```

## Troubleshooting

### MongoDB Connection Failed

**Problem:** Backend fails to connect to MongoDB

**Solution:**
1. Check MongoDB is running: `docker-compose ps mongodb`
2. Check MongoDB health: `docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"`
3. Verify `MONGODB_URI` in `.env` is `mongodb://mongodb:27017/sectube`
4. Check logs: `docker-compose logs mongodb`

### Video Processing Fails

**Problem:** Videos upload but fail to process

**Solution:**
1. Check FFmpeg is installed in backend: `docker-compose exec backend ffmpeg -version`
2. Check disk space: `docker system df`
3. Check backend logs: `docker-compose logs backend | grep ffmpeg`
4. Verify file permissions on volumes
5. Ensure `MAX_VIDEO_SIZE` is sufficient

### Frontend Can't Reach Backend API

**Problem:** API calls fail with 404 or CORS errors

**Solution:**
1. Verify nginx configuration proxies `/api` to backend
2. Check `VITE_API_URL=/api` in `.env`
3. Rebuild frontend: `docker-compose up -d --build frontend`
4. Check nginx logs: `docker-compose logs frontend`
5. Test backend directly: `curl http://localhost:5000/api/videos`

### Port Already in Use

**Problem:** `Error: bind: address already in use`

**Solution:**
1. Change ports in `.env`:
   ```
   FRONTEND_PORT=8080
   BACKEND_PORT=5001
   MONGODB_PORT=27018
   ```
2. Or stop conflicting services:
   ```bash
   # Find process using port 80
   lsof -i :80
   # Kill process
   kill -9 <PID>
   ```

### Container Exits Immediately

**Problem:** Service starts then exits

**Solution:**
1. Check logs: `docker-compose logs <service>`
2. Check for missing environment variables
3. Verify Dockerfile syntax
4. Try running container interactively:
   ```bash
   docker-compose run backend sh
   ```

### Out of Disk Space

**Problem:** Containers fail due to no space

**Solution:**
1. Check Docker disk usage: `docker system df`
2. Clean up unused resources:
   ```bash
   # Remove unused containers, networks, images
   docker system prune -a

   # Remove unused volumes (⚠️ careful!)
   docker volume prune
   ```
3. Monitor volume sizes:
   ```bash
   docker volume ls
   docker volume inspect sectube_backend-videos
   ```

## Production Deployment

### Security Checklist

- [ ] Generate strong `JWT_SECRET` (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (configure reverse proxy like Nginx or Caddy)
- [ ] Enable firewall rules to restrict ports
- [ ] Configure Cloudinary for persistent storage
- [ ] Set up email service (Resend or SMTP)
- [ ] Enable database backups
- [ ] Use Docker secrets for sensitive data
- [ ] Implement rate limiting at reverse proxy
- [ ] Monitor logs and set up alerts
- [ ] Keep Docker images updated

### Reverse Proxy Setup

For production, use a reverse proxy (Nginx, Caddy, Traefik) with SSL:

**Example Nginx config:**
```nginx
server {
    listen 443 ssl http2;
    server_name sectube.com;

    ssl_certificate /etc/letsencrypt/live/sectube.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sectube.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Update `.env`:**
```bash
FRONTEND_URL=https://sectube.com
```

### Cloudinary Setup

For production, use Cloudinary for persistent storage:

1. Sign up at https://cloudinary.com
2. Get credentials from dashboard
3. Update `.env`:
   ```bash
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Database Backups

Set up automated MongoDB backups:

```bash
# Manual backup
docker-compose exec mongodb mongodump --out=/data/backup

# Restore from backup
docker-compose exec mongodb mongorestore /data/backup

# Automated backup script (add to cron)
#!/bin/bash
BACKUP_DIR="/backups/sectube"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T mongodb mongodump --archive > "$BACKUP_DIR/backup_$DATE.archive"
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.archive" -mtime +7 -delete
```

### Monitoring

Monitor container health:

```bash
# Check container stats
docker stats

# Check service health
docker-compose ps

# Set up health check endpoints
curl http://localhost:5000/api/health
```

### Scaling

For high traffic, scale the backend:

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Use load balancer (e.g., Nginx, HAProxy)
```

## Maintenance

### Update Images

```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

### Clean Up

```bash
# Remove stopped containers
docker-compose rm

# Remove all unused Docker resources
docker system prune -a --volumes
```

### Backup Volumes

```bash
# Backup all volumes
docker run --rm -v sectube_mongodb-data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz /data
docker run --rm -v sectube_backend-videos:/data -v $(pwd):/backup alpine tar czf /backup/videos-backup.tar.gz /data
```

## Development with Docker

For development with hot-reload:

1. Create `docker-compose.dev.yml`:
```yaml
version: '3.8'
services:
  backend:
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev

  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev
```

2. Run with override:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [SecTube Backend Documentation](./backend/README.md)
- [SecTube Frontend Documentation](./frontend/README.md)
