/**
 * Advanced Usage Examples
 */

import { EnhancedUniversalCrawler } from '../lib/crawler/EnhancedUniversalCrawler';
import { BaseFilterAgent } from '../lib/agents/BaseFilterAgent';
import { FilterResult, DataType } from '../types';

// Example 1: Custom Filter Agent for E-commerce
class ProductFilterAgent extends BaseFilterAgent {
  private minPrice: number;
  private maxPrice: number;
  private requiredKeywords: string[];

  constructor(name: string, minPrice: number, maxPrice: number, keywords: string[]) {
    super(name, 5);
    this.minPrice = minPrice;
    this.maxPrice = maxPrice;
    this.requiredKeywords = keywords;
  }

  async applyFilter(data: any, context: Record<string, any>): Promise<FilterResult> {
    if (typeof data !== 'object' || !data.price || !data.title) {
      this.metrics.failedExtractions++;
      this.metrics.totalProcessed++;
      return { passed: false, confidence: 0 };
    }

    let confidence = 0.5;

    // Price check
    const price = parseFloat(data.price.replace(/[^0-9.]/g, ''));
    if (price >= this.minPrice && price <= this.maxPrice) {
      confidence += 0.3;
    } else {
      this.metrics.failedExtractions++;
      this.metrics.totalProcessed++;
      return { passed: false, confidence: 0 };
    }

    // Keyword check
    const titleLower = data.title.toLowerCase();
    const keywordMatches = this.requiredKeywords.filter(kw => 
      titleLower.includes(kw.toLowerCase())
    );

    if (keywordMatches.length > 0) {
      confidence += 0.2 * (keywordMatches.length / this.requiredKeywords.length);
    }

    this.metrics.totalProcessed++;
    const passed = confidence >= this.adaptationThreshold;

    if (passed) {
      this.metrics.successfulExtractions++;
    } else {
      this.metrics.failedExtractions++;
    }

    return { passed, confidence };
  }

  learnFromFeedback(data: any, feedback: boolean, context: Record<string, any>): void {
    if (feedback && data.price) {
      const price = parseFloat(data.price.replace(/[^0-9.]/g, ''));
      // Adjust price range based on positive feedback
      if (price < this.minPrice) {
        this.minPrice = Math.max(0, price - 10);
      }
      if (price > this.maxPrice) {
        this.maxPrice = price + 10;
      }
    }
  }
}

async function ecommerceCrawling() {
  console.log('=== E-commerce Product Crawling ===\n');

  const crawler = new EnhancedUniversalCrawler({
    maxConcurrent: 2,
    enableLearning: true,
  });

  await crawler.initialize({ headless: true });

  // Add custom product filter
  const productFilter = new ProductFilterAgent(
    'product_filter',
    10,
    500,
    ['laptop', 'computer', 'notebook']
  );
  crawler.addFilterAgent(productFilter);

  // Add custom extraction for products
  crawler.addExtractionTarget({
    dataType: DataType.CUSTOM,
    selectors: ['.product-item', '.product-card'],
    patterns: [],
    validationRules: {},
    postProcessors: [
      (element: any) => {
        // This would use cheerio in actual implementation
        return {
          title: 'Sample Product',
          price: '$299.99',
          rating: '4.5',
          image: 'https://example.com/image.jpg',
        };
      },
    ],
  });

  console.log('Product filter configured successfully');
  await crawler.close();
}

// Example 2: News Article Extraction with Date Filtering
class DateFilterAgent extends BaseFilterAgent {
  private maxAgeInDays: number;

  constructor(name: string, maxAgeInDays: number) {
    super(name, 4);
    this.maxAgeInDays = maxAgeInDays;
  }

  async applyFilter(data: any, context: Record<string, any>): Promise<FilterResult> {
    if (typeof data !== 'object' || !data.publishDate) {
      this.metrics.failedExtractions++;
      this.metrics.totalProcessed++;
      return { passed: false, confidence: 0 };
    }

    const publishDate = new Date(data.publishDate);
    const now = new Date();
    const ageInDays = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);

    const passed = ageInDays <= this.maxAgeInDays;
    const confidence = passed ? Math.max(0.5, 1 - ageInDays / this.maxAgeInDays) : 0;

    this.metrics.totalProcessed++;
    if (passed) {
      this.metrics.successfulExtractions++;
    } else {
      this.metrics.failedExtractions++;
    }

    return { passed, confidence };
  }

  learnFromFeedback(data: any, feedback: boolean, context: Record<string, any>): void {
    if (feedback && data.publishDate) {
      const publishDate = new Date(data.publishDate);
      const now = new Date();
      const ageInDays = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Adjust max age based on feedback
      if (ageInDays > this.maxAgeInDays) {
        this.maxAgeInDays = Math.ceil(ageInDays);
      }
    }
  }
}

async function newsArticleCrawling() {
  console.log('\n=== News Article Crawling with Date Filtering ===\n');

  const crawler = new EnhancedUniversalCrawler({
    maxConcurrent: 3,
    enableLearning: true,
    enableDeepLearning: true,
  });

  await crawler.initialize({ headless: true });

  // Add date filter (only articles from last 7 days)
  const dateFilter = new DateFilterAgent('recent_articles', 7);
  crawler.addFilterAgent(dateFilter);

  console.log('Date filter configured for articles within 7 days');
  await crawler.close();
}

// Example 3: Social Media Content Extraction
class SentimentFilterAgent extends BaseFilterAgent {
  private positiveKeywords: string[];
  private negativeKeywords: string[];
  private minSentimentScore: number;

  constructor(name: string, minSentimentScore: number = 0.5) {
    super(name, 3);
    this.minSentimentScore = minSentimentScore;
    this.positiveKeywords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    this.negativeKeywords = ['bad', 'terrible', 'awful', 'horrible', 'poor'];
  }

  async applyFilter(data: any, context: Record<string, any>): Promise<FilterResult> {
    if (typeof data !== 'string') {
      this.metrics.failedExtractions++;
      this.metrics.totalProcessed++;
      return { passed: false, confidence: 0 };
    }

    const textLower = data.toLowerCase();
    
    let positiveCount = 0;
    let negativeCount = 0;

    for (const keyword of this.positiveKeywords) {
      if (textLower.includes(keyword)) positiveCount++;
    }

    for (const keyword of this.negativeKeywords) {
      if (textLower.includes(keyword)) negativeCount++;
    }

    const totalWords = data.split(/\s+/).length;
    const sentimentScore = (positiveCount - negativeCount) / Math.max(1, totalWords / 10);
    const normalizedScore = Math.max(0, Math.min(1, (sentimentScore + 1) / 2));

    const passed = normalizedScore >= this.minSentimentScore;
    const confidence = normalizedScore;

    this.metrics.totalProcessed++;
    if (passed) {
      this.metrics.successfulExtractions++;
    } else {
      this.metrics.failedExtractions++;
    }

    return { passed, confidence };
  }

  learnFromFeedback(data: any, feedback: boolean, context: Record<string, any>): void {
    if (typeof data !== 'string') return;

    const words = data.toLowerCase().match(/\b\w+\b/g) || [];
    
    if (feedback) {
      // Add new positive keywords from liked content
      for (const word of words) {
        if (word.length > 4 && !this.positiveKeywords.includes(word)) {
          this.positiveKeywords.push(word);
        }
      }
    } else {
      // Add new negative keywords from disliked content
      for (const word of words) {
        if (word.length > 4 && !this.negativeKeywords.includes(word)) {
          this.negativeKeywords.push(word);
        }
      }
    }
  }
}

async function socialMediaCrawling() {
  console.log('\n=== Social Media Content Extraction ===\n');

  const crawler = new EnhancedUniversalCrawler({
    maxConcurrent: 2,
    enableLearning: true,
  });

  await crawler.initialize({ headless: true });

  // Add sentiment filter
  const sentimentFilter = new SentimentFilterAgent('positive_content', 0.6);
  crawler.addFilterAgent(sentimentFilter);

  console.log('Sentiment filter configured for positive content');
  await crawler.close();
}

// Example 4: Multi-Language Content Detection
class LanguageFilterAgent extends BaseFilterAgent {
  private targetLanguages: string[];
  private languagePatterns: Map<string, RegExp>;

  constructor(name: string, targetLanguages: string[]) {
    super(name, 4);
    this.targetLanguages = targetLanguages;
    this.languagePatterns = new Map([
      ['en', /\b(the|is|are|was|were|have|has|had)\b/i],
      ['es', /\b(el|la|los|las|es|son|está|están)\b/i],
      ['fr', /\b(le|la|les|est|sont|être|avoir)\b/i],
      ['de', /\b(der|die|das|ist|sind|haben|sein)\b/i],
    ]);
  }

  async applyFilter(data: any, context: Record<string, any>): Promise<FilterResult> {
    if (typeof data !== 'string') {
      this.metrics.failedExtractions++;
      this.metrics.totalProcessed++;
      return { passed: false, confidence: 0 };
    }

    let maxConfidence = 0;
    let detectedLanguage = '';

    for (const lang of this.targetLanguages) {
      const pattern = this.languagePatterns.get(lang);
      if (pattern) {
        const matches = data.match(pattern);
        const confidence = matches ? Math.min(1, matches.length / 10) : 0;
        
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          detectedLanguage = lang;
        }
      }
    }

    const passed = maxConfidence >= this.adaptationThreshold;

    this.metrics.totalProcessed++;
    if (passed) {
      this.metrics.successfulExtractions++;
    } else {
      this.metrics.failedExtractions++;
    }

    return { passed, confidence: maxConfidence };
  }

  learnFromFeedback(data: any, feedback: boolean, context: Record<string, any>): void {
    // Language patterns are typically static, but could be enhanced
    if (feedback) {
      this.adaptationThreshold = Math.max(0.3, this.adaptationThreshold - 0.05);
    }
  }
}

async function multiLanguageCrawling() {
  console.log('\n=== Multi-Language Content Detection ===\n');

  const crawler = new EnhancedUniversalCrawler({
    maxConcurrent: 2,
  });

  await crawler.initialize({ headless: true });

  // Add language filter for English and Spanish
  const languageFilter = new LanguageFilterAgent('language_filter', ['en', 'es']);
  crawler.addFilterAgent(languageFilter);

  console.log('Language filter configured for English and Spanish');
  await crawler.close();
}

// Example 5: Comprehensive Monitoring and Reporting
async function comprehensiveMonitoring() {
  console.log('\n=== Comprehensive Monitoring and Reporting ===\n');

  const crawler = new EnhancedUniversalCrawler({
    maxConcurrent: 3,
    enableLearning: true,
    enableDeepLearning: true,
  });

  await crawler.initialize({ headless: true });

  // Simulate crawling
  console.log('Starting monitored crawl...');

  // Get initial stats
  const initialStats = crawler.getComprehensiveStats();
  console.log('\nInitial Statistics:');
  console.log(JSON.stringify(initialStats, null, 2));

  await crawler.close();
}

// Run all advanced examples
async function runAdvancedExamples() {
  try {
    await ecommerceCrawling();
    await newsArticleCrawling();
    await socialMediaCrawling();
    await multiLanguageCrawling();
    await comprehensiveMonitoring();

    console.log('\n✅ All advanced examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running advanced examples:', error);
  }
}

// Uncomment to run
// runAdvancedExamples();

export {
  ProductFilterAgent,
  DateFilterAgent,
  SentimentFilterAgent,
  LanguageFilterAgent,
  ecommerceCrawling,
  newsArticleCrawling,
  socialMediaCrawling,
  multiLanguageCrawling,
  comprehensiveMonitoring,
};