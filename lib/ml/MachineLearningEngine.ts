/**
 * Machine Learning Engine for Adaptive Filtering
 */

import { MLFeatures } from '@/types';
import { logger } from '@/lib/utils/logger';

export class MachineLearningEngine {
  private featureWeights: Map<string, number>;
  private trainingData: Array<{ features: MLFeatures; feedback: boolean }>;
  private predictionCache: Map<string, number>;
  private modelVersion: number;
  private cacheSizeLimit: number;

  constructor() {
    this.featureWeights = new Map();
    this.trainingData = [];
    this.predictionCache = new Map();
    this.modelVersion = 1;
    this.cacheSizeLimit = 10000;
    logger.info('Machine Learning Engine initialized');
  }

  extractFeatures(data: any, context: Record<string, any>): MLFeatures {
    const features: MLFeatures = {};

    if (typeof data === 'string') {
      // Text-based features
      features.length = Math.min(data.length / 100.0, 1.0);
      features.wordCount = Math.min(data.split(/\s+/).length / 20.0, 1.0);
      features.vowelRatio = (data.match(/[aeiouAEIOU]/g)?.length || 0) / Math.max(1, data.length);
      features.digitRatio = (data.match(/\d/g)?.length || 0) / Math.max(1, data.length);
      features.specialCharRatio =
        (data.match(/[^\w\s]/g)?.length || 0) / Math.max(1, data.length);
      features.uppercaseRatio =
        (data.match(/[A-Z]/g)?.length || 0) / Math.max(1, data.length);
      features.whitespaceRatio =
        (data.match(/\s/g)?.length || 0) / Math.max(1, data.length);

      // Linguistic features
      const words = data.split(/\s+/);
      features.avgWordLength =
        words.length > 0
          ? words.reduce((sum, w) => sum + w.length, 0) / words.length / 10.0
          : 0;
      features.uniqueWordRatio =
        words.length > 0 ? new Set(words).size / words.length : 0;
    }

    // Context-based features
    features.sourceReliability = context.sourceReliability || 0.5;
    features.extractionDepth = Math.min((context.extractionDepth || 1) / 10.0, 1.0);
    features.timeOfDay = (Date.now() % 86400000) / 86400000;

    return features;
  }

  predictQuality(data: any, context: Record<string, any>): number {
    // Check cache
    const cacheKey = this.generateCacheKey(data, context);
    if (this.predictionCache.has(cacheKey)) {
      return this.predictionCache.get(cacheKey)!;
    }

    const features = this.extractFeatures(data, context);

    // Simple weighted sum prediction
    let score = 0.5; // Base score
    for (const [feature, value] of Object.entries(features)) {
      const weight = this.featureWeights.get(feature) || 0;
      score += weight * value;
    }

    const result = Math.max(0.0, Math.min(1.0, score));

    // Cache management
    if (this.predictionCache.size >= this.cacheSizeLimit) {
      const keysToRemove = Array.from(this.predictionCache.keys()).slice(
        0,
        this.cacheSizeLimit / 2
      );
      keysToRemove.forEach(key => this.predictionCache.delete(key));
    }

    this.predictionCache.set(cacheKey, result);
    return result;
  }

  trainFromFeedback(
    data: any,
    context: Record<string, any>,
    feedback: boolean,
    learningRate: number = 0.01
  ): void {
    const features = this.extractFeatures(data, context);
    const target = feedback ? 1.0 : 0.0;

    // Simple gradient descent update
    const currentPrediction = this.predictQuality(data, context);
    const error = target - currentPrediction;

    for (const [feature, value] of Object.entries(features)) {
      const currentWeight = this.featureWeights.get(feature) || 0;
      this.featureWeights.set(feature, currentWeight + learningRate * error * value);
    }

    this.trainingData.push({ features, feedback });
    this.predictionCache.clear();

    logger.debug(`ML Engine trained on feedback. Error: ${error.toFixed(3)}`);

    // Periodic model version update
    if (this.trainingData.length % 100 === 0) {
      this.modelVersion++;
      logger.info(`ML Engine updated to version ${this.modelVersion}`);
    }
  }

  private generateCacheKey(data: any, context: Record<string, any>): string {
    return `${JSON.stringify(data)}_${JSON.stringify(context)}`;
  }

  getStats(): Record<string, any> {
    const topFeatures = Array.from(this.featureWeights.entries())
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 5);

    return {
      trainingSamples: this.trainingData.length,
      featureCount: this.featureWeights.size,
      modelVersion: this.modelVersion,
      cacheSize: this.predictionCache.size,
      topFeatures,
    };
  }
}