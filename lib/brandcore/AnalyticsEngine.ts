/**
 * Analytics and Performance Tracking for BrandCore
 */

import { DomainResult, GenerationStats, UserPreferences } from '@/types/brandcore';
import { logger } from '@/lib/utils/logger';

interface AnalyticsEvent {
  type: 'generation_started' | 'generation_completed' | 'domain_selected' | 'export_triggered' | 'tld_selected';
  timestamp: Date;
  data: any;
  userId?: string;
}

interface PerformanceMetrics {
  generationTime: number[];
  successRate: number;
  averageScore: number;
  popularTlds: Record<string, number>;
  popularIndustries: Record<string, number>;
  userRetention: number;
  conversionRate: number;
}

export class BrandCoreAnalytics {
  private events: AnalyticsEvent[] = [];
  private metrics: PerformanceMetrics;
  private storageKey = 'brandcore_analytics';

  constructor() {
    this.metrics = {
      generationTime: [],
      successRate: 0,
      averageScore: 0,
      popularTlds: {},
      popularIndustries: {},
      userRetention: 0,
      conversionRate: 0,
    };
    this.loadAnalytics();
  }

  trackEvent(type: AnalyticsEvent['type'], data: any, userId?: string): void {
    const event: AnalyticsEvent = {
      type,
      timestamp: new Date(),
      data,
      userId,
    };

    this.events.push(event);
    this.updateMetrics(event);
    this.saveAnalytics();

    logger.debug(`Analytics event tracked: ${type}`, data);
  }

  trackGenerationStart(config: any, userId?: string): void {
    this.trackEvent('generation_started', {
      mode: config.mode,
      industry: config.industry?.name,
      wordType: config.wordType?.name,
      lengthRange: config.lengthRange,
      brandabilityScore: config.brandabilityScore,
    }, userId);
  }

  trackGenerationComplete(results: DomainResult[], stats: GenerationStats, userId?: string): void {
    this.trackEvent('generation_completed', {
      resultCount: results.length,
      processingTime: stats.processingTime,
      averageScore: stats.averageScore,
      topScore: stats.topScore,
      sourcesUsed: stats.sourcesUsed,
    }, userId);

    // Update generation time metrics
    this.metrics.generationTime.push(stats.processingTime);
    if (this.metrics.generationTime.length > 100) {
      this.metrics.generationTime = this.metrics.generationTime.slice(-50);
    }

    // Update average score
    this.metrics.averageScore = (this.metrics.averageScore + stats.averageScore) / 2;
  }

  trackDomainSelection(domain: DomainResult, tld: string, userId?: string): void {
    this.trackEvent('domain_selected', {
      domain: domain.domain,
      score: domain.score,
      brandability: domain.brandability,
      category: domain.semanticAnalysis.category,
      tld,
    }, userId);

    // Update popular TLDs
    this.metrics.popularTlds[tld] = (this.metrics.popularTlds[tld] || 0) + 1;
  }

  trackExport(format: string, resultCount: number, userId?: string): void {
    this.trackEvent('export_triggered', {
      format,
      resultCount,
    }, userId);
  }

  trackTldSelection(tld: string, userId?: string): void {
    this.trackEvent('tld_selected', { tld }, userId);
  }

  private updateMetrics(event: AnalyticsEvent): void {
    switch (event.type) {
      case 'generation_completed':
        this.updateSuccessRate();
        break;
      case 'domain_selected':
        this.updateConversionRate();
        break;
    }
  }

  private updateSuccessRate(): void {
    const generations = this.events.filter(e => e.type === 'generation_completed');
    const totalGenerations = this.events.filter(e => e.type === 'generation_started');
    
    if (totalGenerations.length > 0) {
      this.metrics.successRate = generations.length / totalGenerations.length;
    }
  }

  private updateConversionRate(): void {
    const selections = this.events.filter(e => e.type === 'domain_selected');
    const generations = this.events.filter(e => e.type === 'generation_completed');
    
    if (generations.length > 0) {
      this.metrics.conversionRate = selections.length / generations.length;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getEventHistory(limit: number = 100): AnalyticsEvent[] {
    return this.events.slice(-limit);
  }

  getPopularTlds(limit: number = 10): Array<{ tld: string; count: number }> {
    return Object.entries(this.metrics.popularTlds)
      .map(([tld, count]) => ({ tld, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getPopularIndustries(limit: number = 10): Array<{ industry: string; count: number }> {
    return Object.entries(this.metrics.popularIndustries)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getGenerationPerformance(): {
    averageTime: number;
    minTime: number;
    maxTime: number;
    medianTime: number;
  } {
    const times = this.metrics.generationTime;
    
    if (times.length === 0) {
      return { averageTime: 0, minTime: 0, maxTime: 0, medianTime: 0 };
    }

    const sorted = [...times].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return {
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      medianTime: median,
    };
  }

  getUserEngagement(): {
    totalEvents: number;
    uniqueUsers: number;
    averageEventsPerUser: number;
    retentionRate: number;
  } {
    const uniqueUsers = new Set(this.events.map(e => e.userId).filter(Boolean));
    const totalEvents = this.events.length;
    
    return {
      totalEvents,
      uniqueUsers: uniqueUsers.size,
      averageEventsPerUser: uniqueUsers.size > 0 ? totalEvents / uniqueUsers.size : 0,
      retentionRate: this.metrics.userRetention,
    };
  }

  generateReport(): {
    summary: any;
    performance: any;
    userBehavior: any;
    recommendations: string[];
  } {
    const performance = this.getGenerationPerformance();
    const popularTlds = this.getPopularTlds();
    const popularIndustries = this.getPopularIndustries();
    const engagement = this.getUserEngagement();

    const recommendations = this.generateRecommendations(performance, engagement);

    return {
      summary: {
        totalGenerations: this.events.filter(e => e.type === 'generation_completed').length,
        totalSelections: this.events.filter(e => e.type === 'domain_selected').length,
        successRate: this.metrics.successRate,
        conversionRate: this.metrics.conversionRate,
        averageScore: this.metrics.averageScore,
      },
      performance: {
        generationTimes: performance,
        popularTlds,
        popularIndustries,
      },
      userBehavior: {
        engagement,
        eventHistory: this.getEventHistory(20),
      },
      recommendations,
    };
  }

  private generateRecommendations(performance: any, engagement: any): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (performance.averageTime > 120000) { // 2 minutes
      recommendations.push('Consider optimizing generation algorithms for faster performance');
    }

    if (this.metrics.successRate < 0.8) {
      recommendations.push('Investigate generation failures to improve success rate');
    }

    // User engagement recommendations
    if (engagement.retentionRate < 0.5) {
      recommendations.push('Improve user experience to increase retention');
    }

    if (this.metrics.conversionRate < 0.1) {
      recommendations.push('Enhance domain quality to improve selection conversion');
    }

    // TLD recommendations
    const popularTlds = this.getPopularTlds(3);
    if (popularTlds.length > 0) {
      recommendations.push(`Focus on ${popularTlds[0].tld} TLD as it's most popular among users`);
    }

    return recommendations;
  }

  exportData(format: 'json' | 'csv'): string {
    const report = this.generateReport();

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['timestamp', 'type', 'userId', 'data'];
      const rows = this.events.map(event => [
        event.timestamp.toISOString(),
        event.type,
        event.userId || '',
        JSON.stringify(event.data),
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return '';
  }

  clearAnalytics(): void {
    this.events = [];
    this.metrics = {
      generationTime: [],
      successRate: 0,
      averageScore: 0,
      popularTlds: {},
      popularIndustries: {},
      userRetention: 0,
      conversionRate: 0,
    };
    this.saveAnalytics();
  }

  private saveAnalytics(): void {
    try {
      const data = {
        events: this.events.slice(-1000), // Keep last 1000 events
        metrics: this.metrics,
        lastUpdated: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      }
    } catch (error) {
      logger.error('Failed to save analytics:', error);
    }
  }

  private loadAnalytics(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          this.events = data.events || [];
          this.metrics = { ...this.metrics, ...data.metrics };
        }
      }
    } catch (error) {
      logger.error('Failed to load analytics:', error);
    }
  }

  // Real-time monitoring
  startRealTimeMonitoring(callback: (metrics: PerformanceMetrics) => void): () => void {
    const interval = setInterval(() => {
      callback(this.getMetrics());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }

  // A/B testing support
  trackABTest(testName: string, variant: string, userId?: string): void {
    this.trackEvent('ab_test', { testName, variant }, userId);
  }

  getABTestResults(testName: string): Record<string, { count: number; conversionRate: number }> {
    const testEvents = this.events.filter(e => 
      e.type === 'ab_test' && e.data.testName === testName
    );

    const results: Record<string, { count: number; conversionRate: number }> = {};

    for (const event of testEvents) {
      const variant = event.data.variant;
      if (!results[variant]) {
        results[variant] = { count: 0, conversionRate: 0 };
      }
      results[variant].count++;
    }

    return results;
  }
}