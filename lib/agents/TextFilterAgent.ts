/**
 * Text Filter Agent Implementation
 */

import { BaseFilterAgent } from './BaseFilterAgent';
import { FilterResult } from '@/types';
import { logger } from '@/lib/utils/logger';

export class TextFilterAgent extends BaseFilterAgent {
  private patterns: string[];
  private minLength: number;
  private maxLength: number;
  private learnedPatterns: Set<string>;
  private blacklistPatterns: Set<string>;

  constructor(
    name: string,
    patterns: string[] = [],
    minLength: number = 3,
    maxLength: number = 500
  ) {
    super(name);
    this.patterns = patterns;
    this.minLength = minLength;
    this.maxLength = maxLength;
    this.learnedPatterns = new Set();
    this.blacklistPatterns = new Set();
    
    logger.info(`TextFilterAgent initialized with ${patterns.length} patterns`);
  }

  async applyFilter(data: any, context: Record<string, any>): Promise<FilterResult> {
    const startTime = Date.now();
    let confidence = 0.0;

    // Type check
    if (typeof data !== 'string') {
      this.metrics.failedExtractions++;
      this.metrics.totalProcessed++;
      return { passed: false, confidence: 0.0 };
    }

    // Length check
    const dataLength = data.length;
    if (dataLength < this.minLength || dataLength > this.maxLength) {
      this.metrics.failedExtractions++;
      this.metrics.totalProcessed++;
      return { passed: false, confidence: 0.0 };
    }

    // Pattern matching
    let patternMatches = 0;
    const allPatterns = [...this.patterns, ...Array.from(this.learnedPatterns)];
    const totalPatterns = allPatterns.length;

    if (totalPatterns > 0) {
      for (const pattern of allPatterns) {
        try {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(data)) {
            patternMatches++;
            confidence += 0.2;
          }
        } catch (error) {
          logger.warning(`Invalid regex pattern: ${pattern}`);
        }
      }
    } else {
      confidence = 0.5;
    }

    // Blacklist check
    for (const blacklistPattern of this.blacklistPatterns) {
      try {
        const regex = new RegExp(blacklistPattern, 'i');
        if (regex.test(data)) {
          this.metrics.failedExtractions++;
          this.metrics.totalProcessed++;
          return { passed: false, confidence: 0.0 };
        }
      } catch (error) {
        logger.warning(`Invalid blacklist pattern: ${blacklistPattern}`);
      }
    }

    // Strategy-based confidence adjustment
    if (this.strategy === 'aggressive') {
      confidence *= 1.5;
    } else if (this.strategy === 'stealth') {
      confidence *= 0.8;
    }

    // Update metrics
    const processingTime = Date.now() - startTime;
    this.updateProcessingTime(processingTime);
    this.metrics.totalProcessed++;
    this.metrics.confidenceScores.push(confidence);

    const passed = confidence >= this.adaptationThreshold;
    if (passed) {
      this.metrics.successfulExtractions++;
    } else {
      this.metrics.failedExtractions++;
    }

    return { passed, confidence: Math.min(1.0, confidence) };
  }

  learnFromFeedback(data: any, feedback: boolean, context: Record<string, any>): void {
    if (typeof data !== 'string') return;

    if (feedback) {
      // Extract patterns from positive feedback
      const words = data.toLowerCase().match(/\b\w+\b/g) || [];
      for (const word of words) {
        if (word.length >= 3) {
          const pattern = `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`;
          this.learnedPatterns.add(pattern);
          logger.debug(`Learned positive pattern: ${pattern}`);
        }
      }
    } else {
      // Add to blacklist for negative feedback
      const pattern = `\\b${data.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`;
      this.blacklistPatterns.add(pattern);
      logger.debug(`Added to blacklist: ${pattern}`);
    }
  }
}