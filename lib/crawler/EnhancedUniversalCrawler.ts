/**
 * Enhanced Universal Web Crawler - Main Implementation
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { CrawlResult, ExtractionTarget, DataType, CrawlerConfig, CrawlerStats } from '@/types';
import { BaseFilterAgent } from '@/lib/agents/BaseFilterAgent';
import { TextFilterAgent } from '@/lib/agents/TextFilterAgent';
import { URLFilterAgent } from '@/lib/agents/URLFilterAgent';
import { ContentQualityAgent } from '@/lib/agents/ContentQualityAgent';
import { EmailFilterAgent } from '@/lib/agents/EmailFilterAgent';
import { MachineLearningEngine } from '@/lib/ml/MachineLearningEngine';
import { DeepLearningEngine } from '@/lib/ml/DeepLearningEngine';
import { AdvancedStealthEngine } from '@/lib/stealth/StealthEngine';
import { AdvancedStorageEngine } from '@/lib/storage/StorageEngine';
import { AdvancedMonitoringSystem } from '@/lib/monitoring/MonitoringSystem';
import { logger } from '@/lib/utils/logger';

export class EnhancedUniversalCrawler {
  private browser: Browser | null = null;
  private session: AxiosInstance | null = null;
  private filterAgents: BaseFilterAgent[] = [];
  private extractionTargets: ExtractionTarget[] = [];
  private mlEngine: MachineLearningEngine | null = null;
  private deepLearningEngine: DeepLearningEngine | null = null;
  private stealthEngine: AdvancedStealthEngine;
  private storageEngine: AdvancedStorageEngine;
  private monitoringSystem: AdvancedMonitoringSystem;
  private maxConcurrent: number;
  private globalStats: CrawlerStats;
  private retryPolicies: Record<string, any>;

  constructor(config: CrawlerConfig = {}) {
    this.maxConcurrent = config.maxConcurrent || 5;
    this.mlEngine = config.enableLearning ? new MachineLearningEngine() : null;
    this.deepLearningEngine = config.enableDeepLearning ? new DeepLearningEngine() : null;
    this.stealthEngine = new AdvancedStealthEngine();
    this.storageEngine = new AdvancedStorageEngine();
    this.monitoringSystem = new AdvancedMonitoringSystem();

    this.globalStats = {
      pagesCrawled: 0,
      dataExtracted: 0,
      errorsEncountered: 0,
      totalProcessingTime: 0,
    };

    this.retryPolicies = {
      maxRetries: 3,
      backoffFactor: 2.0,
      retryOnStatus: [429, 500, 502, 503, 504],
    };

    logger.info(`EnhancedUniversalCrawler initialized with max_concurrent=${this.maxConcurrent}`);
  }

  async initialize(browserConfig: Record<string, any> = {}): Promise<void> {
    if (!this.browser) {
      const launchOptions = {
        headless: browserConfig.headless !== false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--disable-extensions',
          '--disable-blink-features=AutomationControlled',
          ...(browserConfig.additionalArgs || []),
        ],
      };

      try {
        this.browser = await puppeteer.launch(launchOptions);
        logger.info('Browser initialized successfully');
      } catch (error) {
        logger.error(`Browser initialization failed: ${error}`);
        this.browser = null;
      }
    }

    if (!this.session) {
      try {
        this.session = axios.create({
          timeout: browserConfig.timeout || 30000,
          headers: this.getDefaultHeaders(),
          maxRedirects: 5,
        });
        logger.info('HTTP session initialized successfully');
      } catch (error) {
        logger.error(`Session initialization failed: ${error}`);
        this.session = null;
      }
    }
  }

  private getDefaultHeaders(): Record<string, string> {
    return {
      'User-Agent': this.getRandomUserAgent(),
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      DNT: '1',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  addFilterAgent(agent: BaseFilterAgent): void {
    this.filterAgents.push(agent);
    this.filterAgents.sort((a, b) => b.priority - a.priority);
    logger.info(`Added filter agent: ${agent.name} with priority ${agent.priority}`);
  }

  addExtractionTarget(target: ExtractionTarget): void {
    this.extractionTargets.push(target);
    logger.info(`Added extraction target for ${target.dataType}`);
  }

  async crawlUrl(url: string, extractionMethod: 'browser' | 'http' = 'browser'): Promise<CrawlResult[]> {
    const startTime = Date.now();
    const results: CrawlResult[] = [];

    try {
      logger.info(`Crawling URL: ${url} using ${extractionMethod}`);

      let content: string;
      if (extractionMethod === 'browser' && this.browser) {
        content = await this.crawlWithBrowser(url);
      } else {
        content = await this.crawlWithSession(url);
      }

      // Extract data based on targets
      for (const target of this.extractionTargets) {
        const extractedData = await this.extractData(content, target, url);

        for (const data of extractedData) {
          let passedFilters = true;
          let totalConfidence = 0.0;
          let filterCount = 0;

          const context = {
            sourceUrl: url,
            extractionDepth: 1,
            sourceReliability: 0.7,
            timestamp: Date.now(),
            crawler: this,
          };

          // Apply all filter agents
          for (const agent of this.filterAgents) {
            if (agent.isActive) {
              const { passed, confidence } = await agent.applyFilter(data, context);
              if (!passed) {
                passedFilters = false;
                break;
              }
              totalConfidence += confidence;
              filterCount++;
            }
          }

          if (passedFilters && filterCount > 0) {
            let avgConfidence = totalConfidence / filterCount;

            // Apply ML prediction if available
            if (this.mlEngine) {
              const mlConfidence = this.mlEngine.predictQuality(data, context);
              avgConfidence = (avgConfidence + mlConfidence) / 2;
            }

            // Apply deep learning analysis if available
            let semanticAnalysis = {
              semanticQuality: 0.5,
              coherence: 0.5,
              contextRelevance: 0.5,
              anomalyLevel: 0.5,
            };

            if (this.deepLearningEngine && typeof data === 'string') {
              semanticAnalysis = await this.deepLearningEngine.analyzeSemanticQuality(data);
              avgConfidence = (avgConfidence + semanticAnalysis.semanticQuality) / 2;
            }

            const result: CrawlResult = {
              data,
              confidence: avgConfidence,
              metadata: { ...context, ...semanticAnalysis },
              extractionTime: Date.now() - startTime,
              sourceUrl: url,
            };

            // Store with advanced analysis
            if (this.deepLearningEngine) {
              await this.storageEngine.storeWithAnalysis(result, semanticAnalysis);
            } else {
              await this.storageEngine.storeResult(result);
            }

            results.push(result);
          }
        }
      }

      this.globalStats.pagesCrawled++;
      this.globalStats.dataExtracted += results.length;
      logger.info(`Successfully crawled ${url}: extracted ${results.length} items`);
    } catch (error) {
      this.globalStats.errorsEncountered++;
      logger.error(`Error crawling ${url}: ${error}`);
    } finally {
      this.globalStats.totalProcessingTime += Date.now() - startTime;
    }

    // Update monitoring
    await this.monitoringSystem.trackPerformance(this.getComprehensiveStats());

    return results;
  }

  private async crawlWithBrowser(url: string): Promise<string> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    await page.setUserAgent(this.getRandomUserAgent());

    // Apply advanced stealth techniques
    await this.stealthEngine.enhanceStealth(page);

    try {
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for dynamic content
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

      const content = await page.content();
      return content;
    } finally {
      await page.close();
    }
  }

  private async crawlWithSession(url: string): Promise<string> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    const response = await this.session.get(url);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  private async extractData(content: string, target: ExtractionTarget, sourceUrl: string): Promise<any[]> {
    const $ = cheerio.load(content);
    const extractedData: any[] = [];

    // Remove unwanted elements
    $('script, style, nav, footer, header, aside').remove();

    if (target.dataType === DataType.TEXT) {
      // CSS selector extraction
      for (const selector of target.selectors) {
        try {
          $(selector).each((_, element) => {
            const text = $(element).text().trim();
            if (text) {
              extractedData.push(text);
            }
          });
        } catch (error) {
          logger.warning(`Selector extraction failed for ${selector}: ${error}`);
        }
      }

      // Pattern extraction
      const textContent = $.text();
      for (const pattern of target.patterns) {
        try {
          const regex = new RegExp(pattern, 'gi');
          const matches = textContent.match(regex);
          if (matches) {
            extractedData.push(...matches);
          }
        } catch (error) {
          logger.warning(`Pattern extraction failed for ${pattern}: ${error}`);
        }
      }
    } else if (target.dataType === DataType.URL) {
      const selectors = target.selectors.length > 0 ? target.selectors : ['a[href]'];
      for (const selector of selectors) {
        try {
          $(selector).each((_, element) => {
            let href = $(element).attr('href');
            if (href) {
              // Convert relative URLs to absolute
              if (href.startsWith('/')) {
                const urlObj = new URL(sourceUrl);
                href = `${urlObj.protocol}//${urlObj.host}${href}`;
              } else if (!href.startsWith('http')) {
                href = new URL(href, sourceUrl).href;
              }
              extractedData.push(href);
            }
          });
        } catch (error) {
          logger.warning(`URL extraction failed for ${selector}: ${error}`);
        }
      }
    } else if (target.dataType === DataType.EMAIL) {
      const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const textContent = $.text();
      const emails = textContent.match(emailPattern);
      if (emails) {
        extractedData.push(...emails);
      }
    }

    // Apply post-processors
    let processedData = extractedData;
    for (const processor of target.postProcessors) {
      const newData: any[] = [];
      for (const item of processedData) {
        try {
          const processed = processor(item);
          if (processed !== null && processed !== undefined) {
            newData.push(processed);
          }
        } catch (error) {
          logger.warning(`Post-processor failed: ${error}`);
        }
      }
      processedData = newData;
    }

    return processedData;
  }

  async bulkCrawl(urls: string[], extractionMethod: 'browser' | 'http' = 'browser'): Promise<CrawlResult[]> {
    logger.info(`Starting bulk crawl of ${urls.length} URLs`);

    const results: CrawlResult[] = [];
    const chunks: string[][] = [];

    // Split URLs into chunks based on maxConcurrent
    for (let i = 0; i < urls.length; i += this.maxConcurrent) {
      chunks.push(urls.slice(i, i + this.maxConcurrent));
    }

    // Process chunks sequentially
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async url => {
        // Random delay for stealth
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
        return this.crawlUrl(url, extractionMethod);
      });

      const chunkResults = await Promise.allSettled(chunkPromises);

      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(...result.value);
        } else {
          logger.error(`Bulk crawl error: ${result.reason}`);
        }
      }
    }

    logger.info(`Bulk crawl completed: ${results.length} items extracted`);
    return results;
  }

  addUserFeedback(data: any, liked: boolean, context: Record<string, any> = {}): void {
    // Update filter agents
    for (const agent of this.filterAgents) {
      agent.learnFromFeedback(data, liked, context);
    }

    // Update ML engine
    if (this.mlEngine) {
      this.mlEngine.trainFromFeedback(data, context, liked);
    }

    logger.info(`User feedback processed: ${liked ? 'positive' : 'negative'}`);
  }

  getComprehensiveStats(): CrawlerStats {
    const stats = { ...this.globalStats };

    // Add agent-specific stats
    stats.filterAgents = {};
    for (const agent of this.filterAgents) {
      stats.filterAgents[agent.name] = agent.getStats();
    }

    // Add ML stats if available
    if (this.mlEngine) {
      stats.mlEngine = this.mlEngine.getStats();
    }

    // Add deep learning stats
    if (this.deepLearningEngine) {
      stats.deepLearning = this.deepLearningEngine.getStats();
    }

    // Add storage stats
    stats.storage = this.storageEngine.getStats();

    // Add monitoring stats
    stats.monitoring = this.monitoringSystem.getStats();

    return stats;
  }

  async close(): Promise<void> {
    logger.info('Closing crawler resources...');

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser closed');
    }

    this.storageEngine.close();
    logger.info('Storage engine closed');
  }
}