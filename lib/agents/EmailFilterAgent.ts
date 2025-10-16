/**
 * Email Filter Agent Implementation
 */

import { BaseFilterAgent } from './BaseFilterAgent';
import { FilterResult } from '@/types';
import { logger } from '@/lib/utils/logger';

export class EmailFilterAgent extends BaseFilterAgent {
  private emailPattern: RegExp;
  private trustedDomains: Set<string>;
  private blockedDomains: Set<string>;

  constructor(name: string) {
    super(name);
    this.emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    this.trustedDomains = new Set();
    this.blockedDomains = new Set();
  }

  async applyFilter(data: any, context: Record<string, any>): Promise<FilterResult> {
    if (typeof data !== 'string') {
      this.metrics.failedExtractions++;
      this.metrics.totalProcessed++;
      return { passed: false, confidence: 0.0 };
    }

    let confidence = 0.0;

    // Check if it matches email pattern
    if (this.emailPattern.test(data)) {
      confidence += 0.5;

      // Extract domain
      const domain = data.split('@')[1]?.toLowerCase();

      if (domain) {
        // Check trusted domains
        if (this.trustedDomains.has(domain)) {
          confidence += 0.3;
        }

        // Check blocked domains
        if (this.blockedDomains.has(domain)) {
          this.metrics.failedExtractions++;
          this.metrics.totalProcessed++;
          return { passed: false, confidence: 0.0 };
        }

        // Basic domain validation
        if (domain.includes('.') && domain.split('.').pop()!.length >= 2) {
          confidence += 0.2;
        }
      }
    } else {
      this.metrics.failedExtractions++;
      this.metrics.totalProcessed++;
      return { passed: false, confidence: 0.0 };
    }

    this.metrics.totalProcessed++;
    const passed = confidence >= this.adaptationThreshold;

    if (passed) {
      this.metrics.successfulExtractions++;
    } else {
      this.metrics.failedExtractions++;
    }

    return { passed, confidence: Math.min(1.0, confidence) };
  }

  learnFromFeedback(data: any, feedback: boolean, context: Record<string, any>): void {
    if (typeof data !== 'string' || !data.includes('@')) return;

    const domain = data.split('@')[1]?.toLowerCase();
    if (!domain) return;

    if (feedback) {
      this.trustedDomains.add(domain);
      this.blockedDomains.delete(domain);
    } else {
      this.blockedDomains.add(domain);
      this.trustedDomains.delete(domain);
    }
  }
}