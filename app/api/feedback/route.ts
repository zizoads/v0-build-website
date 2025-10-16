/**
 * API Route for User Feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedUniversalCrawler } from '@/lib/crawler/EnhancedUniversalCrawler';

// Store crawler instance (in production, use a proper state management solution)
let crawlerInstance: EnhancedUniversalCrawler | null = null;

function getCrawlerInstance(): EnhancedUniversalCrawler {
  if (!crawlerInstance) {
    crawlerInstance = new EnhancedUniversalCrawler({
      maxConcurrent: 3,
      enableLearning: true,
      enableDeepLearning: true,
    });
  }
  return crawlerInstance;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, liked, context = {} } = body;

    if (data === undefined || liked === undefined) {
      return NextResponse.json(
        { success: false, error: 'Data and liked fields are required' },
        { status: 400 }
      );
    }

    const crawler = getCrawlerInstance();
    crawler.addUserFeedback(data, liked, context);

    return NextResponse.json({
      success: true,
      message: 'Feedback processed successfully',
    });
  } catch (error: any) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}