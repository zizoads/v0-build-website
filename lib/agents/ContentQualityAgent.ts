/**
 * Content Quality Filter Agent Implementation
 */

import { BaseFilterAgent } from './BaseFilterAgent';
import { FilterResult } from '@/types';
import { logger } from '@/lib/utils/logger';

export class ContentQualityAgent extends BaseFilterAgent {
  private qualityIndicators: Record<string, number>;

  constructor(name: string) {
    super(name);
    this.qualityIndicators = {
      hasVowels: 0.1,
      balancedLength: 0.2,
      noExcessiveRepetition: 0.15,
      properCapitalization: 0.1,
      containsMeaningfulWords: 0.25,
      grammaticalStructure: 0.2,
    };
  }

  async applyFilter(data: any, context: Record<string, any>): Promise<FilterResult> {
    if (typeof data !== 'string') {
      this.metrics.failedExtractions++;
      this.metrics.totalProcessed++;
      return { passed: false, confidence: 0.0 };
    }

    let confidence = 0.0;

    // Check vowels
    if (/[aeiouAEIOU]/.test(data)) {
      confidence += this.qualityIndicators.hasVowels;
    }

    // Balanced length
    if (data.length >= 5 && data.length <= 100) {
      confidence += this.qualityIndicators.balancedLength;
    }

    // No excessive repetition
    if (!/(.)\1{3,}/.test(data)) {
      confidence += this.qualityIndicators.noExcessiveRepetition;
    }

    // Proper capitalization
    if (data.length > 0 && data[0] === data[0].toUpperCase() && data !== data.toUpperCase()) {
      confidence += this.qualityIndicators.properCapitalization;
    }

    // Contains meaningful words
    const words = data.match(/\b\w{3,}\b/g) || [];
    if (words.length >= 1) {
      confidence += this.qualityIndicators.containsMeaningfulWords;
    }

    // Basic grammatical structure
    if (/\b(the|a|an|is|are|was|were|have|has|had)\b/i.test(data)) {
      confidence += this.qualityIndicators.grammaticalStructure;
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
    if (typeof data !== 'string') return;

    const adjustment = feedback ? 0.05 : -0.05;
    for (const key in this.qualityIndicators) {
      this.qualityIndicators[key] = Math.max(
        0.0,
        Math.min(1.0, this.qualityIndicators[key] + adjustment)
      );
    }
  }
}