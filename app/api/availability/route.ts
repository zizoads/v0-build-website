/**
 * API Route for Domain Availability Checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { DomainAvailabilityChecker } from '@/lib/brandcore/AvailabilityChecker';
import { APIResponse } from '@/types/brandcore';

// Store checker instance
let checkerInstance: DomainAvailabilityChecker | null = null;

function getChecker(): DomainAvailabilityChecker {
  if (!checkerInstance) {
    checkerInstance = new DomainAvailabilityChecker();
  }
  return checkerInstance;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, tlds } = body;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Domain is required' },
        { status: 400 }
      );
    }

    const checker = getChecker();
    const availability = await checker.checkAvailability(domain, tlds);

    return NextResponse.json({
      success: true,
      data: availability,
    });
  } catch (error: any) {
    console.error('Availability API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    const checker = getChecker();
    const available = await checker.checkSingleDomain(domain);

    return NextResponse.json({
      success: true,
      data: { domain, available },
    });
  } catch (error: any) {
    console.error('Single availability check error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}