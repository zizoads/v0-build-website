/**
 * Basic Usage Examples
 */

import { EnhancedUniversalCrawler } from '../lib/crawler/EnhancedUniversalCrawler';
import { TextFilterAgent } from '../lib/agents/TextFilterAgent';
import { URLFilterAgent } from '../lib/agents/URLFilterAgent';
import { ContentQualityAgent } from '../lib/agents/ContentQualityAgent';
import { DataType } from '../types';

// Example 1: Simple Text Extraction
async function simpleTextExtraction() {
  console.log('=== Example 1: Simple Text Extraction ===\n');

  const crawler = new EnhancedUniversalCrawler({
    maxConcurrent: 2,
    enableLearning: false,
    enableDeepLearning: false,
  });

  await crawler.initialize({ headless: true });

  // Add basic text filter
  const textAgent = new TextFilterAgent('english_text', [/\b[a-zA-Z]{3,}\b/], 5, 300);
  crawler.addFilterAgent(textAgent);

  // Add extraction target
  crawler.addExtractionTarget({
    dataType: DataType.TEXT,
    selectors: ['p', 'h1', 'h2'],
    patterns: [],
    validationRules: {},
    postProcessors: [(x: string) => x.trim()],
  });

  // Crawl
  const results = await crawler.crawlUrl('https://example.com');

  console.log(`Extracted ${results.length} items:`);
  results.slice(0, 5).forEach((result, i) => {
    console.log(`${i + 1}. [${(result.confidence * 100).toFixed(1)}%] ${result.data}`);
  });

  await crawler.close();
}

// Example 2: URL Extraction with Domain Filtering
async function urlExtractionWithFiltering() {
  console.log('\n=== Example 2: URL Extraction with Domain Filtering ===\n');

  const crawler = new EnhancedUniversalCrawler({
    maxConcurrent: 2,
  });

  await crawler.initialize({ headless: true });

  // Add URL filter for specific domains
  const urlAgent = new URLFilterAgent('safe_urls', ['wikipedia.org', 'github.com'], ['https']);
  crawler.addFilterAgent(urlAgent);

  // Add URL extraction target
  crawler.addExtractionTarget({
    dataType: DataType.URL,
    selectors: ['a[href]'],
    patterns: [],
    validationRules: {},
    postProcessors: [(x: string) => (x.startsWith('http') ? x : null)],
  });

  // Crawl
  const results = await crawler.crawlUrl('https://en.wikipedia.org/wiki/Web_scraping');

  console.log(`Extracted ${results.length} URLs:`);
  results.slice(0, 10).forEach((result, i) => {
    console.log(`${i + 1}. ${result.data}`);
  });

  await crawler.close();
}

// Example 3: Advanced Filtering with ML
async function advancedFilteringWithML() {
  console.log('\n=== Example 3: Advanced Filtering with ML ===\n');

  const crawler = new EnhancedUniversalCrawler({
    maxConcurrent: 2,
    enableLearning: true,
    enableDeepLearning: true,
  });

  await crawler.initialize({ headless: true });

  // Add multiple filter agents
  const textAgent = new TextFilterAgent('text', [/\b[a-zA-Z]{4,}\b/]);
  const qualityAgent = new ContentQualityAgent('quality');

  crawler.addFilterAgent(textAgent);
  crawler.addFilterAgent(qualityAgent);

  // Add extraction target
  crawler.addExtractionTarget({
    dataType: DataType.TEXT,
    selectors: ['p', 'article', 'div.content'],
    patterns: [],
    validationRules: {},
    postProcessors: [
      (x: string) => x.trim(),
      (x: string) => (x.length > 20 ? x : null),
    ],
  });

  // Crawl
  const results = await crawler.crawlUrl('https://en.wikipedia.org/wiki/Artificial_intelligence');

  console.log(`Extracted ${results.length} high-quality items:`);
  results.slice(0, 5).forEach((result, i) => {
    console.log(`${i + 1}. [${(result.confidence * 100).toFixed(1)}%]`);
    console.log(`   Semantic Quality: ${((result.metadata.semanticQuality || 0) * 100).toFixed(1)}%`);
    console.log(`   ${result.data.substring(0, 100)}...`);
  });

  // Simulate user feedback
  console.log('\nSimulating user feedback...');
  crawler.addUserFeedback(results[0].data, true);
  crawler.addUserFeedback(results[1].data, false);

  const stats = crawler.getComprehensiveStats();
  console.log('\nCrawler Statistics:');
  console.log(`- Pages Crawled: ${stats.pagesCrawled}`);
  console.log(`- Data Extracted: ${stats.dataExtracted}`);
  console.log(`- Processing Time: ${(stats.totalProcessingTime / 1000).toFixed(2)}s`);

  await crawler.close();
}

// Example 4: Bulk Crawling Multiple Sites
async function bulkCrawling() {
  console.log('\n=== Example 4: Bulk Crawling Multiple Sites ===\n');

  const crawler = new EnhancedUniversalCrawler({
    maxConcurrent: 3,
    enableLearning: true,
  });

  await crawler.initialize({ headless: true });

  // Add filters
  const textAgent = new TextFilterAgent('text', [/\b[a-zA-Z]{3,}\b/]);
  crawler.addFilterAgent(textAgent);

  // Add extraction target
  crawler.addExtractionTarget({
    dataType: DataType.TEXT,
    selectors: ['h1', 'h2', 'p'],
    patterns: [],
    validationRules: {},
    postProcessors: [(x: string) => x.trim()],
  });

  // Multiple URLs
  const urls = [
    'https://example.com',
    'https://en.wikipedia.org/wiki/Web_scraping',
  ];

  console.log(`Crawling ${urls.length} URLs...`);
  const results = await crawler.bulkCrawl(urls);

  console.log(`\nTotal extracted: ${results.length} items`);

  // Group by source
  const bySource = results.reduce((acc, result) => {
    acc[result.sourceUrl] = (acc[result.sourceUrl] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nResults by source:');
  Object.entries(bySource).forEach(([url, count]) => {
    console.log(`- ${url}: ${count} items`);
  });

  await crawler.close();
}

// Example 5: Custom Post-Processing
async function customPostProcessing() {
  console.log('\n=== Example 5: Custom Post-Processing ===\n');

  const crawler = new EnhancedUniversalCrawler({
    maxConcurrent: 2,
  });

  await crawler.initialize({ headless: true });

  const textAgent = new TextFilterAgent('text', [/\b[a-zA-Z]{3,}\b/]);
  crawler.addFilterAgent(textAgent);

  // Add extraction target with custom post-processors
  crawler.addExtractionTarget({
    dataType: DataType.TEXT,
    selectors: ['p'],
    patterns: [],
    validationRules: {},
    postProcessors: [
      // Remove extra whitespace
      (x: string) => x.replace(/\s+/g, ' ').trim(),
      // Remove short texts
      (x: string) => (x.length >= 20 ? x : null),
      // Capitalize first letter
      (x: string) => x.charAt(0).toUpperCase() + x.slice(1),
      // Truncate long texts
      (x: string) => (x.length > 200 ? x.substring(0, 200) + '...' : x),
    ],
  });

  const results = await crawler.crawlUrl('https://example.com');

  console.log(`Extracted ${results.length} processed items:`);
  results.slice(0, 5).forEach((result, i) => {
    console.log(`${i + 1}. ${result.data}`);
  });

  await crawler.close();
}

// Run all examples
async function runAllExamples() {
  try {
    await simpleTextExtraction();
    await urlExtractionWithFiltering();
    await advancedFilteringWithML();
    await bulkCrawling();
    await customPostProcessing();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Uncomment to run
// runAllExamples();

export {
  simpleTextExtraction,
  urlExtractionWithFiltering,
  advancedFilteringWithML,
  bulkCrawling,
  customPostProcessing,
};