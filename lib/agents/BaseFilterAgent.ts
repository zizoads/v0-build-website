/**
 * Base Filter Agent Implementation
 */

import { BaseFilterAgent as IBaseFilterAgent, AgentMetrics, FilterResult, StrategyType } from '@/types';
import { logger } from '@/lib/utils/logger';

export abstract class BaseFilterAgent implements IBaseFilterAgent {
  name: string;
  priority: number;
  strategy: StrategyType;
  metrics: AgentMetrics;
  learningData: Map<string, any[]>;
  isActive: boolean;
  adaptationThreshold: number;

  constructor(name: string, priority: number = 1) {
    this.name = name;
    this.priority = priority;
    this.strategy = StrategyType.BALANCED;
    this.metrics = {
      totalProcessed: 0,
      successfulExtractions: 0,
      failedExtractions: 0,
      avgProcessingTime: 0,
      confidenceScores: [],
      lastUpdated: Date.now(),
    };
    this.learningData = new Map();
    this.isActive = true;
    this.adaptationThreshold = 0.7;
    
    logger.info(`Initialized filter agent: ${name} with priority ${priority}`);
  }

  abstract applyFilter(data: any, context: Record<string, any>): Promise<FilterResult>;
  abstract learnFromFeedback(data: any, feedback: boolean, context: Record<string, any>): void;

  updateStrategy(successRate: number): void {
    if (successRate < 0.3) {
      this.strategy = StrategyType.AGGRESSIVE;
      logger.info(`${this.name}: Switching to AGGRESSIVE strategy`);
    } else if (successRate < 0.6) {
      this.strategy = StrategyType.BALANCED;
      logger.info(`${this.name}: Switching to BALANCED strategy`);
    } else if (successRate > 0.8) {
      this.strategy = StrategyType.STEALTH;
      logger.info(`${this.name}: Switching to STEALTH strategy`);
    } else {
      this.strategy = StrategyType.ADAPTIVE;
      logger.info(`${this.name}: Switching to ADAPTIVE strategy`);
    }
  }

  getSuccessRate(): number {
    if (this.metrics.totalProcessed === 0) return 0;
    return this.metrics.successfulExtractions / this.metrics.totalProcessed;
  }

  updateProcessingTime(newTime: number): void {
    if (this.metrics.totalProcessed === 0) {
      this.metrics.avgProcessingTime = newTime;
    } else {
      this.metrics.avgProcessingTime =
        (this.metrics.avgProcessingTime * this.metrics.totalProcessed + newTime) /
        (this.metrics.totalProcessed + 1);
    }
  }

  getStats(): Record<string, any> {
    return {
      name: this.name,
      priority: this.priority,
      strategy: this.strategy,
      totalProcessed: this.metrics.totalProcessed,
      successfulExtractions: this.metrics.successfulExtractions,
      failedExtractions: this.metrics.failedExtractions,
      successRate: this.getSuccessRate(),
      avgProcessingTime: this.metrics.avgProcessingTime,
      isActive: this.isActive,
    };
  }
}