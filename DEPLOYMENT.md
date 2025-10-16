# Deployment Guide - Enhanced Universal Web Crawler

This guide covers various deployment scenarios for the Enhanced Universal Web Crawler.

## Table of Contents

1. [Local Development](#local-development)
2. [Production Deployment](#production-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Platforms](#cloud-platforms)
5. [Performance Optimization](#performance-optimization)
6. [Monitoring & Maintenance](#monitoring--maintenance)

## Local Development

### Setup

```bash
# Install dependencies
npm install

# Create data directory
mkdir -p data/reports

# Run development server
npm run dev
```

### Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_PATH=./data/crawler_advanced.db

# Crawler Settings
MAX_CONCURRENT=3
ENABLE_LEARNING=true
ENABLE_DEEP_LEARNING=true

# Browser Settings
HEADLESS=true
BROWSER_TIMEOUT=30000

# API Settings
API_TIMEOUT=300000
```

## Production Deployment

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "web-crawler" -- start

# Save PM2 configuration
pm2 save

# Setup auto-restart on system reboot
pm2 startup
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name crawler.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

# Install Chromium and dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build application
RUN npm run build

# Create data directory
RUN mkdir -p /app/data/reports

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/stats', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  web-crawler:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MAX_CONCURRENT=3
      - ENABLE_LEARNING=true
      - ENABLE_DEEP_LEARNING=true
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - web-crawler
    restart: unless-stopped
```

### Build and Run

```bash
# Build image
docker build -t web-crawler:latest .

# Run container
docker run -d \
  --name web-crawler \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  web-crawler:latest

# Or use docker-compose
docker-compose up -d
```

## Cloud Platforms

### AWS Elastic Beanstalk

1. **Install EB CLI:**
```bash
pip install awsebcli
```

2. **Initialize:**
```bash
eb init -p node.js-18 web-crawler
```

3. **Create environment:**
```bash
eb create web-crawler-env
```

4. **Deploy:**
```bash
eb deploy
```

### Google Cloud Run

1. **Build and push image:**
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/web-crawler
```

2. **Deploy:**
```bash
gcloud run deploy web-crawler \
  --image gcr.io/PROJECT_ID/web-crawler \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --timeout 300s \
  --allow-unauthenticated
```

### Heroku

1. **Create Heroku app:**
```bash
heroku create web-crawler-app
```

2. **Add buildpacks:**
```bash
heroku buildpacks:add --index 1 heroku/nodejs
heroku buildpacks:add --index 2 jontewks/puppeteer
```

3. **Deploy:**
```bash
git push heroku main
```

### DigitalOcean App Platform

1. **Create `app.yaml`:**
```yaml
name: web-crawler
services:
  - name: web
    github:
      repo: your-username/web-crawler
      branch: main
    build_command: npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: professional-xs
    http_port: 3000
    routes:
      - path: /
```

2. **Deploy:**
```bash
doctl apps create --spec app.yaml
```

## Performance Optimization

### 1. Caching Strategy

```typescript
// Implement Redis caching
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

async function getCachedOrCrawl(url: string) {
  const cached = await redis.get(`crawl:${url}`);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const results = await crawler.crawlUrl(url);
  await redis.setex(`crawl:${url}`, 3600, JSON.stringify(results));
  
  return results;
}
```

### 2. Database Optimization

```sql
-- Add indexes for better query performance
CREATE INDEX idx_url_timestamp ON crawl_results(url, timestamp);
CREATE INDEX idx_confidence_quality ON crawl_results(confidence, semantic_quality);

-- Vacuum database regularly
VACUUM;
ANALYZE;
```

### 3. Resource Limits

```typescript
// Limit memory usage
const crawler = new EnhancedUniversalCrawler({
  maxConcurrent: 2, // Reduce for lower memory
  enableDeepLearning: false, // Disable if not needed
});

// Set Node.js memory limit
// node --max-old-space-size=2048 server.js
```

### 4. Load Balancing

```nginx
upstream crawler_backend {
    least_conn;
    server crawler1:3000;
    server crawler2:3000;
    server crawler3:3000;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://crawler_backend;
    }
}
```

## Monitoring & Maintenance

### 1. Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
  
  return Response.json(health);
}
```

### 2. Logging

```typescript
// Use Winston for production logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### 3. Monitoring Tools

**Prometheus Metrics:**
```typescript
import { register, Counter, Histogram } from 'prom-client';

const crawlCounter = new Counter({
  name: 'crawler_requests_total',
  help: 'Total number of crawl requests',
});

const crawlDuration = new Histogram({
  name: 'crawler_duration_seconds',
  help: 'Duration of crawl requests',
});
```

### 4. Backup Strategy

```bash
#!/bin/bash
# backup.sh

# Backup database
DATE=$(date +%Y%m%d_%H%M%S)
cp data/crawler_advanced.db backups/crawler_$DATE.db

# Compress old backups
find backups/ -name "*.db" -mtime +7 -exec gzip {} \;

# Delete backups older than 30 days
find backups/ -name "*.db.gz" -mtime +30 -delete
```

### 5. Automated Maintenance

```bash
# Cron job for daily maintenance
0 2 * * * /app/scripts/maintenance.sh

# maintenance.sh
#!/bin/bash
cd /app

# Vacuum database
sqlite3 data/crawler_advanced.db "VACUUM; ANALYZE;"

# Clear old logs
find logs/ -name "*.log" -mtime +7 -delete

# Restart service if needed
pm2 restart web-crawler
```

## Security Best Practices

### 1. Environment Variables

```bash
# Never commit .env files
echo ".env*" >> .gitignore

# Use secrets management
# AWS Secrets Manager, Google Secret Manager, etc.
```

### 2. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Input Validation

```typescript
import { z } from 'zod';

const crawlSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(10),
  extractionMethod: z.enum(['browser', 'http']),
});

// Validate input
const validated = crawlSchema.parse(requestBody);
```

### 4. HTTPS/SSL

```bash
# Use Let's Encrypt for free SSL
certbot --nginx -d crawler.yourdomain.com
```

## Troubleshooting

### Common Issues

**1. Out of Memory:**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

**2. Puppeteer Crashes:**
```bash
# Install missing dependencies
apt-get install -y libgbm1 libasound2
```

**3. Database Locked:**
```typescript
// Use WAL mode for better concurrency
db.exec('PRAGMA journal_mode=WAL;');
```

**4. Slow Performance:**
```typescript
// Reduce concurrent crawls
const crawler = new EnhancedUniversalCrawler({
  maxConcurrent: 1,
});
```

## Scaling Strategies

### Horizontal Scaling

```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-crawler
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-crawler
  template:
    metadata:
      labels:
        app: web-crawler
    spec:
      containers:
      - name: web-crawler
        image: web-crawler:latest
        resources:
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

### Queue-Based Architecture

```typescript
// Use Bull for job queuing
import Queue from 'bull';

const crawlQueue = new Queue('crawl', {
  redis: { host: 'localhost', port: 6379 }
});

crawlQueue.process(5, async (job) => {
  return await crawler.crawlUrl(job.data.url);
});
```

---

**For additional support, consult the main README.md and INTEGRATION_GUIDE.md**