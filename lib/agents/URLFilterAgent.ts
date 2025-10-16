/**
 * URL Filter Agent Implementation
 */

import { BaseFilterAgent } from './BaseFilterAgent';
import { FilterResult } from '@/types';
import { logger } from '@/lib/utils/logger';

export class URLFilterAgent extends BaseFilterAgent {
  private allowedDomains: Set<string>;
  private allowedSchemes: Set<string>;
  private domainScores: Map<string, number>;

  constructor(
    name: string,
    allowedDomains: string[] = [],
    allowedSchemes: string[] = ['http', 'https']
  ) {
    super(name);
    this.allowedDomains = new Set(allowedDomains);
    this.allowedSchemes = new Set(allowedSchemes);
    this.domainScores = new Map();
    
    logger.info(`URLFilterAgent initialized with ${allowedDomains.length} allowed domains`);
  }

  async applyFilter(data: any, context: Record<string, any>): Promise<FilterResult> {
    try {
      const url = new URL(data);
      let confidence = 0.0;

      // Scheme check
      if (this.allowedSchemes.has(url.protocol.replace(':', ''))) {
        confidence += 0.3;
      } else {
        this.metrics.failedExtractions++;
        this.metrics.totalProcessed++;
        return { passed: false, confidence: 0.0 };
      }

      // Domain check
      const domain = url.hostname.toLowerCase();
      if (!domain) {
        this.metrics.failedExtractions++;
        this.metrics.totalProcessed++;
        return { passed: false, confidence: 0.0 };
      }

      if (this.allowedDomains.size > 0) {
        const domainAllowed = Array.from(this.allowedDomains).some(allowed =>
          domain.includes(allowed)
        );
        if (domainAllowed) {
          confidence += 0.4;
        } else {
          this.metrics.failedExtractions++;
          this.metrics.totalProcessed++;
          return { passed: false, confidence: 0.0 };
        }
      } else {
        confidence += 0.4;
      }

      // Domain score from learning
      if (this.domainScores.has(domain)) {
        confidence += (this.domainScores.get(domain) || 0) * 0.3;
      }

      this.metrics.totalProcessed++;
      const passed = confidence >= this.adaptationThreshold;

      if (passed) {
        this.metrics.successfulExtractions++;
      } else {
        this.metrics.failedExtractions++;
      }

      return { passed, confidence: Math.min(1.0, confidence) };
    } catch (error) {
      logger.error(`URL filtering error: ${error}`);
      this.metrics.failedExtractions++;
      this.metrics.totalProcessed++;
      return { passed: false, confidence: 0.0 };
    }
  }

  learnFromFeedback(data: any, feedback: boolean, context: Record<string, any>): void {
    try {
      const url = new URL(data);
      const domain = url.hostname.toLowerCase();
      const adjustment = feedback ? 0.1 : -0.1;
      const currentScore = this.domainScores.get(domain) || 0;
      const newScore = Math.max(-1.0, Math.min(1.0, currentScore + adjustment));
      this.domainScores.set(domain, newScore);
      logger.debug(`Updated domain score for ${domain}: ${newScore}`);
    } catch (error) {
      logger.error(`Error learning from URL feedback: ${error}`);
    }
  }
}