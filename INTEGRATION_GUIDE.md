# Integration Guide - Enhanced Universal Web Crawler

This guide provides detailed instructions for integrating the Enhanced Universal Web Crawler into your existing projects or systems.

## Table of Contents

1. [Quick Integration](#quick-integration)
2. [Standalone Service](#standalone-service)
3. [Library Integration](#library-integration)
4. [Custom Implementations](#custom-implementations)
5. [Advanced Scenarios](#advanced-scenarios)

## Quick Integration

### Option 1: Use as API Service

The simplest way to integrate is to run the crawler as a separate service and call its API endpoints.

**Step 1: Start the Service**
```bash
npm run build
npm start
```

**Step 2: Call from Your Application**

**JavaScript/TypeScript:**
```typescript
async function crawlWebsite(urls: string[]) {
  const response = await fetch('http://localhost:3000/api/crawl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      urls,
      extractionMethod: 'browser',
    }),
  });
  
  const data = await response.json();
  return data.results;
}

// Usage
const results = await crawlWebsite(['https://example.com']);
```

**Python:**
```python
import requests

def crawl_website(urls):
    response = requests.post(
        'http://localhost:3000/api/crawl',
        json={'urls': urls, 'extractionMethod': 'browser'}
    )
    return response.json()['results']

# Usage
results = crawl_website(['https://example.com'])
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com"], "extractionMethod": "browser"}'
```

### Option 2: Embed in Next.js Project

**Step 1: Copy Files**
```bash
# Copy library files
cp -r lib/ your-nextjs-project/lib/
cp -r types/ your-nextjs-project/types/

# Copy API routes
cp -r app/api/ your-nextjs-project/app/api/
```

**Step 2: Install Dependencies**
```bash
cd your-nextjs-project
npm install puppeteer cheerio axios better-sqlite3
npm install -D @types/better-sqlite3
```

**Step 3: Use in Your Code**
```typescript
import { EnhancedUniversalCrawler } from '@/lib/crawler/EnhancedUniversalCrawler';

// Your implementation
```

## Standalone Service

### Docker Deployment

**Create Dockerfile:**
```dockerfile
FROM node:18-alpine

# Install Chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Build and Run:**
```bash
docker build -t web-crawler .
docker run -p 3000:3000 web-crawler
```

### Kubernetes Deployment

**Create deployment.yaml:**
```yaml
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
        ports:
        - containerPort: 3000
        resources:
          limits:
            memory: "2Gi"
            cpu: "1000m"
          requests:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: web-crawler-service
spec:
  selector:
    app: web-crawler
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Library Integration

### React Application

```typescript
// hooks/useCrawler.ts
import { useState } from 'react';

interface CrawlResult {
  data: any;
  confidence: number;
  sourceUrl: string;
}

export function useCrawler() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CrawlResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const crawl = async (urls: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { crawl, loading, results, error };
}

// Usage in component
function MyComponent() {
  const { crawl, loading, results } = useCrawler();

  const handleCrawl = () => {
    crawl(['https://example.com']);
  };

  return (
    <div>
      <button onClick={handleCrawl} disabled={loading}>
        {loading ? 'Crawling...' : 'Start Crawl'}
      </button>
      {results.map((result, i) => (
        <div key={i}>{result.data}</div>
      ))}
    </div>
  );
}
```

### Express.js Backend

```typescript
// server.ts
import express from 'express';
import { EnhancedUniversalCrawler } from './lib/crawler/EnhancedUniversalCrawler';
import { TextFilterAgent } from './lib/agents/TextFilterAgent';
import { DataType } from './types';

const app = express();
app.use(express.json());

let crawler: EnhancedUniversalCrawler | null = null;

async function initCrawler() {
  crawler = new EnhancedUniversalCrawler({
    maxConcurrent: 3,
    enableLearning: true,
    enableDeepLearning: true,
  });

  await crawler.initialize({ headless: true });

  const textAgent = new TextFilterAgent('text', [/\b\w+\b/]);
  crawler.addFilterAgent(textAgent);

  crawler.addExtractionTarget({
    dataType: DataType.TEXT,
    selectors: ['p', 'h1', 'h2'],
    patterns: [],
    validationRules: {},
    postProcessors: [],
  });
}

app.post('/crawl', async (req, res) => {
  try {
    if (!crawler) await initCrawler();

    const { urls } = req.body;
    const results = await crawler!.bulkCrawl(urls);

    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Crawler service running on port 3000');
});
```

### NestJS Integration

```typescript
// crawler.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EnhancedUniversalCrawler } from './lib/crawler/EnhancedUniversalCrawler';

@Injectable()
export class CrawlerService implements OnModuleInit, OnModuleDestroy {
  private crawler: EnhancedUniversalCrawler;

  async onModuleInit() {
    this.crawler = new EnhancedUniversalCrawler({
      maxConcurrent: 3,
      enableLearning: true,
    });

    await this.crawler.initialize({ headless: true });
  }

  async onModuleDestroy() {
    await this.crawler.close();
  }

  async crawlUrls(urls: string[]) {
    return await this.crawler.bulkCrawl(urls);
  }

  getStats() {
    return this.crawler.getComprehensiveStats();
  }
}

// crawler.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { CrawlerService } from './crawler.service';

@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post('crawl')
  async crawl(@Body() body: { urls: string[] }) {
    const results = await this.crawlerService.crawlUrls(body.urls);
    return { success: true, results };
  }

  @Get('stats')
  getStats() {
    return this.crawlerService.getStats();
  }
}
```

## Custom Implementations

### Custom Filter Agent

```typescript
import { BaseFilterAgent } from '@/lib/agents/BaseFilterAgent';
import { FilterResult } from '@/types';

export class PriceFilterAgent extends BaseFilterAgent {
  private minPrice: number;
  private maxPrice: number;

  constructor(name: string, minPrice: number, maxPrice: number) {
    super(name, 3); // Priority 3
    this.minPrice = minPrice;
    this.maxPrice = maxPrice;
  }

  async applyFilter(data: any, context: Record<string, any>): Promise<FilterResult> {
    if (typeof data !== 'string') {
      return { passed: false, confidence: 0 };
    }

    // Extract price from text
    const priceMatch = data.match(/\$(\d+(?:\.\d{2})?)/);
    
    if (!priceMatch) {
      return { passed: false, confidence: 0 };
    }

    const price = parseFloat(priceMatch[1]);
    const passed = price >= this.minPrice && price <= this.maxPrice;
    const confidence = passed ? 0.9 : 0.1;

    this.metrics.totalProcessed++;
    if (passed) {
      this.metrics.successfulExtractions++;
    } else {
      this.metrics.failedExtractions++;
    }

    return { passed, confidence };
  }

  learnFromFeedback(data: any, feedback: boolean, context: Record<string, any>): void {
    // Adjust price range based on feedback
    if (feedback && typeof data === 'string') {
      const priceMatch = data.match(/\$(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);
        // Expand range slightly towards this price
        if (price < this.minPrice) {
          this.minPrice = Math.max(0, this.minPrice - 10);
        }
        if (price > this.maxPrice) {
          this.maxPrice += 10;
        }
      }
    }
  }
}

// Usage
const priceFilter = new PriceFilterAgent('price_filter', 10, 100);
crawler.addFilterAgent(priceFilter);
```

### Custom Extraction Target

```typescript
import { DataType } from '@/types';

// Extract product information
crawler.addExtractionTarget({
  dataType: DataType.CUSTOM,
  selectors: ['.product-card', '.item'],
  patterns: [],
  validationRules: {
    hasPrice: true,
    hasTitle: true,
  },
  postProcessors: [
    (element: any) => {
      // Custom extraction logic
      const $ = cheerio.load(element);
      return {
        title: $('.product-title').text().trim(),
        price: $('.product-price').text().trim(),
        image: $('.product-image').attr('src'),
        rating: $('.product-rating').text().trim(),
      };
    },
    (product: any) => {
      // Validation
      return product.title && product.price ? product : null;
    },
  ],
});
```

## Advanced Scenarios

### Scheduled Crawling

```typescript
import cron from 'node-cron';

// Crawl every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting scheduled crawl...');
  
  const crawler = new EnhancedUniversalCrawler({
    maxConcurrent: 5,
    enableLearning: true,
  });

  await crawler.initialize({ headless: true });

  const urls = [
    'https://example.com',
    'https://another-site.com',
  ];

  const results = await crawler.bulkCrawl(urls);
  
  // Process results
  console.log(`Crawled ${results.length} items`);
  
  await crawler.close();
});
```

### Webhook Integration

```typescript
// Send results to webhook
async function crawlAndNotify(urls: string[], webhookUrl: string) {
  const crawler = new EnhancedUniversalCrawler({
    maxConcurrent: 3,
  });

  await crawler.initialize({ headless: true });

  const results = await crawler.bulkCrawl(urls);

  // Send to webhook
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      stats: crawler.getComprehensiveStats(),
    }),
  });

  await crawler.close();
}
```

### Queue-Based Processing

```typescript
import Bull from 'bull';

const crawlQueue = new Bull('crawl-queue');

// Add jobs to queue
crawlQueue.process(async (job) => {
  const { urls } = job.data;
  
  const crawler = new EnhancedUniversalCrawler({
    maxConcurrent: 3,
  });

  await crawler.initialize({ headless: true });

  const results = await crawler.bulkCrawl(urls);
  
  await crawler.close();

  return results;
});

// Add job
await crawlQueue.add({ urls: ['https://example.com'] });
```

### Real-time Streaming

```typescript
import { EventEmitter } from 'events';

class StreamingCrawler extends EventEmitter {
  private crawler: EnhancedUniversalCrawler;

  constructor() {
    super();
    this.crawler = new EnhancedUniversalCrawler({
      maxConcurrent: 3,
    });
  }

  async initialize() {
    await this.crawler.initialize({ headless: true });
  }

  async crawlWithStreaming(urls: string[]) {
    for (const url of urls) {
      this.emit('crawl:start', { url });

      try {
        const results = await this.crawler.crawlUrl(url);
        this.emit('crawl:results', { url, results });
      } catch (error) {
        this.emit('crawl:error', { url, error });
      }

      this.emit('crawl:complete', { url });
    }
  }
}

// Usage
const streamingCrawler = new StreamingCrawler();
await streamingCrawler.initialize();

streamingCrawler.on('crawl:results', ({ url, results }) => {
  console.log(`Results from ${url}:`, results);
});

await streamingCrawler.crawlWithStreaming(['https://example.com']);
```

## Best Practices

1. **Resource Management**: Always close the crawler when done
2. **Error Handling**: Implement proper error handling and retries
3. **Rate Limiting**: Respect target websites with appropriate delays
4. **Monitoring**: Track performance and errors
5. **Security**: Validate inputs and sanitize outputs
6. **Scalability**: Use queue systems for large-scale crawling
7. **Compliance**: Respect robots.txt and terms of service

## Troubleshooting

### Common Issues

**Issue: Memory leaks**
```typescript
// Solution: Close crawler properly
try {
  const results = await crawler.bulkCrawl(urls);
} finally {
  await crawler.close();
}
```

**Issue: Timeout errors**
```typescript
// Solution: Increase timeout
await crawler.initialize({ 
  headless: true,
  timeout: 60000, // 60 seconds
});
```

**Issue: Too many concurrent requests**
```typescript
// Solution: Reduce concurrency
const crawler = new EnhancedUniversalCrawler({
  maxConcurrent: 2, // Lower value
});
```

## Support

For additional help:
- Check the main README.md
- Review example implementations
- Open an issue on GitHub
- Consult the API documentation

---

**Happy Crawling! 🚀**