/**
 * API Route for Domain Generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdvancedDomainGenerator } from '@/lib/brandcore/DomainGenerator';
import { DomainGenerationConfig, GenerationProgress, APIResponse } from '@/types/brandcore';

export const maxDuration = 300; // 5 minutes timeout

// Store generator instance
let generatorInstance: AdvancedDomainGenerator | null = null;

async function getGenerator(): Promise<AdvancedDomainGenerator> {
  if (!generatorInstance) {
    generatorInstance = new AdvancedDomainGenerator();
    await generatorInstance.initialize();
  }
  return generatorInstance;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config: DomainGenerationConfig = body;

    // Validate config
    if (!config || !config.mode || !config.industry || !config.wordType) {
      return NextResponse.json(
        { success: false, error: 'Invalid configuration' },
        { status: 400 }
      );
    }

    const generator = await getGenerator();

    // For streaming progress, we'll use Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const results = await generator.generateDomains(config, (progress: GenerationProgress) => {
            // Send progress update
            const data = `data: ${JSON.stringify({ type: 'progress', data: progress })}\n\n`;
            controller.enqueue(encoder.encode(data));
          });

          // Send final results
          const finalData = `data: ${JSON.stringify({ type: 'complete', data: results })}\n\n`;
          controller.enqueue(encoder.encode(finalData));
          controller.close();
        } catch (error) {
          const errorData = `data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const generator = await getGenerator();
    
    // Return generator status and capabilities
    const status = {
      ready: true,
      capabilities: {
        fastMode: true,
        advancedMode: true,
        webScraping: true,
        semanticAnalysis: true,
        availabilityChecking: true,
        bulkGeneration: true,
      },
      supportedTlds: ['com', 'net', 'org', 'io', 'ai', 'co', 'app', 'dev', 'tech', 'store'],
      maxResults: 100,
      estimatedTime: {
        fast: '~10-30s',
        advanced: '~1-3min',
      },
    };

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}