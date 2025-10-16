/**
 * API Route for Crawler Statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdvancedStorageEngine } from '@/lib/storage/StorageEngine';

export async function GET(request: NextRequest) {
  try {
    const storageEngine = new AdvancedStorageEngine();
    const stats = storageEngine.getStats();
    
    // Get recent results
    const recentResults = await storageEngine.getResults(10);
    
    storageEngine.close();

    return NextResponse.json({
      success: true,
      stats,
      recentResults,
    });
  } catch (error: any) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}