/**
 * API Route for Searching Crawled Data
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdvancedStorageEngine } from '@/lib/storage/StorageEngine';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const storageEngine = new AdvancedStorageEngine();
    const results = await storageEngine.searchResults(query, limit);
    storageEngine.close();

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}