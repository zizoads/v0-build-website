/**
 * Advanced Monitoring System for Performance Tracking
 */

import { Alert, PerformanceMetric, PerformanceReport, CrawlerStats } from '@/types';
import { logger } from '@/lib/utils/logger';

export class AdvancedMonitoringSystem {
  private performanceMetrics: Map<string, PerformanceMetric[]>;
  private realTimeAlerts: Alert[];
  private performanceThresholds: Record<string, number>;
  private maxAlertsSize: number;

  constructor() {
    this.performanceMetrics = new Map();
    this.realTimeAlerts = [];
    this.maxAlertsSize = 100;
    this.performanceThresholds = {
      successRate: 0.7,
      avgResponseTime: 10.0,
      errorRate: 0.1,
      semanticQuality: 0.6,
    };
    logger.info('Advanced Monitoring System initialized');
  }

  async trackPerformance(stats: CrawlerStats): Promise<void> {
    try {
      this.analyzeTrends(stats);
      this.detectPerformanceAnomalies(stats);
      await this.generateReports(stats);
    } catch (error) {
      logger.error(`Performance tracking failed: ${error}`);
    }
  }

  private analyzeTrends(stats: CrawlerStats): void {
    try {
      const currentTime = Date.now();

      // Track success rate
      const successRates: number[] = [];
      if (stats.filterAgents) {
        for (const agentStats of Object.values(stats.filterAgents)) {
          successRates.push(agentStats.successRate || 0);
        }
      }

      const avgSuccessRate = successRates.length > 0 
        ? successRates.reduce((a, b) => a + b, 0) / successRates.length 
        : 0;

      this.addMetric('successRate', currentTime, avgSuccessRate);

      // Track error rate
      const totalOps = stats.pagesCrawled || 0;
      const errors = stats.errorsEncountered || 0;
      const errorRate = totalOps > 0 ? errors / totalOps : 0;

      this.addMetric('errorRate', currentTime, errorRate);
    } catch (error) {
      logger.error(`Trend analysis failed: ${error}`);
    }
  }

  private addMetric(name: string, timestamp: number, value: number): void {
    if (!this.performanceMetrics.has(name)) {
      this.performanceMetrics.set(name, []);
    }

    const metrics = this.performanceMetrics.get(name)!;
    metrics.push({ timestamp, value });

    // Keep only last 1000 metrics
    if (metrics.length > 1000) {
      metrics.shift();
    }
  }

  private detectPerformanceAnomalies(stats: CrawlerStats): void {
    try {
      const successRateMetrics = this.performanceMetrics.get('successRate') || [];
      if (successRateMetrics.length >= 10) {
        const recentValues = successRateMetrics.slice(-10).map(m => m.value);
        const avgSuccessRate = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;

        if (avgSuccessRate < this.performanceThresholds.successRate) {
          this.triggerAlert(
            `Low success rate detected: ${(avgSuccessRate * 100).toFixed(1)}%`,
            'WARNING'
          );
        }
      }

      const errorRateMetrics = this.performanceMetrics.get('errorRate') || [];
      if (errorRateMetrics.length >= 10) {
        const recentValues = errorRateMetrics.slice(-10).map(m => m.value);
        const avgErrorRate = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;

        if (avgErrorRate > this.performanceThresholds.errorRate) {
          this.triggerAlert(
            `High error rate detected: ${(avgErrorRate * 100).toFixed(1)}%`,
            'ERROR'
          );
        }
      }
    } catch (error) {
      logger.error(`Anomaly detection failed: ${error}`);
    }
  }

  private triggerAlert(message: string, level: 'INFO' | 'WARNING' | 'ERROR'): void {
    try {
      const alert: Alert = {
        timestamp: Date.now(),
        message,
        level,
        context: this.getAlertContext(),
      };

      this.realTimeAlerts.push(alert);

      // Keep only last maxAlertsSize alerts
      if (this.realTimeAlerts.length > this.maxAlertsSize) {
        this.realTimeAlerts.shift();
      }

      logger.warning(`ALERT: ${message}`);
    } catch (error) {
      logger.error(`Alert triggering failed: ${error}`);
    }
  }

  private getAlertContext(): Record<string, any> {
    return {
      activeAlerts: this.realTimeAlerts.length,
      metricsTracked: Array.from(this.performanceMetrics.keys()),
      systemTime: Date.now(),
    };
  }

  private async generateReports(stats: CrawlerStats): Promise<void> {
    try {
      const successRateMetrics = this.performanceMetrics.get('successRate') || [];
      if (successRateMetrics.length % 100 === 0 && successRateMetrics.length > 0) {
        const report = this.createPerformanceReport(stats);
        await this.saveReport(report);
      }
    } catch (error) {
      logger.error(`Report generation failed: ${error}`);
    }
  }

  private createPerformanceReport(stats: CrawlerStats): PerformanceReport {
    return {
      timestamp: Date.now(),
      summary: {
        totalPages: stats.pagesCrawled || 0,
        totalData: stats.dataExtracted || 0,
        avgSuccessRate: this.calculateAvgSuccessRate(),
        systemHealth: this.calculateSystemHealth(),
      },
      agentPerformance: stats.filterAgents || {},
      recommendations: this.generateRecommendations(stats),
    };
  }

  private calculateAvgSuccessRate(): number {
    const metrics = this.performanceMetrics.get('successRate') || [];
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }

  private calculateSystemHealth(): number {
    const healthIndicators: number[] = [];

    const avgSuccessRate = this.calculateAvgSuccessRate();
    if (avgSuccessRate > 0) {
      healthIndicators.push(avgSuccessRate);
    }

    const errorMetrics = this.performanceMetrics.get('errorRate') || [];
    if (errorMetrics.length > 0) {
      const recentErrors = errorMetrics.slice(-10);
      const avgErrorRate = recentErrors.reduce((sum, m) => sum + m.value, 0) / recentErrors.length;
      healthIndicators.push(1 - avgErrorRate);
    }

    if (healthIndicators.length === 0) return 0.7;
    return healthIndicators.reduce((a, b) => a + b, 0) / healthIndicators.length;
  }

  private generateRecommendations(stats: CrawlerStats): string[] {
    const recommendations: string[] = [];

    const avgSuccessRate = this.calculateAvgSuccessRate();
    if (avgSuccessRate < 0.5) {
      recommendations.push('Consider adjusting filter thresholds to improve success rate');
    }

    if ((stats.errorsEncountered || 0) > 10) {
      recommendations.push('High error rate detected - check network connectivity and target websites');
    }

    const totalTime = stats.totalProcessingTime || 0;
    const pages = stats.pagesCrawled || 1;
    const avgTimePerPage = totalTime / pages;

    if (avgTimePerPage > 30) {
      recommendations.push('High processing time per page - consider optimizing extraction targets');
    }

    return recommendations;
  }

  private async saveReport(report: PerformanceReport): Promise<void> {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const reportsDir = path.join(process.cwd(), 'data', 'reports');
      
      await fs.mkdir(reportsDir, { recursive: true });
      
      const filename = path.join(reportsDir, `performance_report_${report.timestamp}.json`);
      await fs.writeFile(filename, JSON.stringify(report, null, 2));
      
      logger.info(`Performance report saved: ${filename}`);
    } catch (error) {
      logger.error(`Report saving failed: ${error}`);
    }
  }

  getStats(): Record<string, any> {
    return {
      activeAlerts: this.realTimeAlerts.length,
      metricsTracked: Array.from(this.performanceMetrics.keys()),
      avgSuccessRate: this.calculateAvgSuccessRate(),
      systemHealth: this.calculateSystemHealth(),
      recentAlerts: this.realTimeAlerts.slice(-5),
    };
  }

  getAlerts(): Alert[] {
    return [...this.realTimeAlerts];
  }

  clearAlerts(): void {
    this.realTimeAlerts = [];
  }
}