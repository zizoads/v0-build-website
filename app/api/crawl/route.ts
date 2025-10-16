/**
 * API Route for Web Crawling
 */

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedUniversalCrawler } from '@/lib/crawler/EnhancedUniversalCrawler';
import { TextFilterAgent } from '@/lib/agents/TextFilterAgent';
import { URLFilterAgent } from '@/lib/agents/URLFilterAgent';
import { ContentQualityAgent } from '@/lib/agents/ContentQualityAgent';
import { EmailFilterAgent } from '@/lib/agents/EmailFilterAgent';
import { DataType } from '@/types';

export const maxDuration = 300; // 5 minutes timeout

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, extractionMethod = 'browser', extractionTargets, filterConfig } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'URLs array is required' },
        { status: 400 }
      );
    }

    // Create crawler instance
    const crawler = new EnhancedUniversalCrawler({
      maxConcurrent: 3,
      enableLearning: true,
      enableDeepLearning: true,
    });

    await crawler.initialize({
      headless: true,
      timeout: 30000,
    });

    // Add default filter agents
    const textAgent = new TextFilterAgent(
      'english_text',
      [/\b[a-zA-Z]{3,}\b/],
      3,
      200
    );
    const urlAgent = new URLFilterAgent('safe_urls', [], ['https', 'http']);
    const qualityAgent = new ContentQualityAgent('content_quality');
    const emailAgent = new EmailFilterAgent('email_filter');

    crawler.addFilterAgent(textAgent);
    crawler.addFilterAgent(urlAgent);
    crawler.addFilterAgent(qualityAgent);
    crawler.addFilterAgent(emailAgent);

    // Add extraction targets
    if (extractionTargets && Array.isArray(extractionTargets)) {
      for (const target of extractionTargets) {
        crawler.addExtractionTarget(target);
      }
    } else {
      // Default extraction targets
      crawler.addExtractionTarget({
        dataType: DataType.TEXT,
        selectors: ['p', 'h1', 'h2', 'h3', 'li', 'span'],
        patterns: [/\b[A-Za-z]{4,20}\b/],
        validationRules: {},
        postProcessors: [
          (x: string) => (x && x.trim().length > 3 ? x.trim() : null),
          (x: string) => (x && x.length < 500 ? x : x.substring(0, 500) + '...'),
        ],
      });

      crawler.addExtractionTarget({
        dataType: DataType.URL,
        selectors: ['a[href]'],
        patterns: [],
        validationRules: {},
        postProcessors: [(x: string) => (x && x.startsWith('http') ? x : null)],
      });
    }

    // Execute crawling
    const results = await crawler.bulkCrawl(urls, extractionMethod);
    const stats = crawler.getComprehensiveStats();

    await crawler.close();

    return NextResponse.json({
      success: true,
      results,
      stats,
    });
  } catch (error: any) {
    console.error('Crawl API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}