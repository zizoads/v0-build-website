/**
 * Core Type Definitions for Enhanced Universal Web Crawler
 */

// Enums
export enum StrategyType {
  AGGRESSIVE = 'aggressive',
  BALANCED = 'balanced',
  STEALTH = 'stealth',
  ADAPTIVE = 'adaptive',
  CUSTOM = 'custom',
}

export enum DataType {
  TEXT = 'text',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone',
  IMAGE_URL = 'image_url',
  JSON_DATA = 'json_data',
  CUSTOM = 'custom',
}

// Core Data Structures
export interface ExtractionTarget {
  dataType: DataType;
  selectors: string[];
  patterns: string[];
  validationRules: Record<string, any>;
  postProcessors: Array<(data: any) => any>;
}

export interface CrawlResult {
  data: any;
  confidence: number;
  metadata: Record<string, any>;
  extractionTime: number;
  sourceUrl: string;
}

export interface AgentMetrics {
  totalProcessed: number;
  successfulExtractions: number;
  failedExtractions: number;
  avgProcessingTime: number;
  confidenceScores: number[];
  lastUpdated: number;
}

export interface FilterResult {
  passed: boolean;
  confidence: number;
}

// Agent Interfaces
export interface BaseFilterAgent {
  name: string;
  priority: number;
  strategy: StrategyType;
  metrics: AgentMetrics;
  learningData: Map<string, any[]>;
  isActive: boolean;
  adaptationThreshold: number;

  applyFilter(data: any, context: Record<string, any>): Promise<FilterResult>;
  learnFromFeedback(data: any, feedback: boolean, context: Record<string, any>): void;
  updateStrategy(successRate: number): void;
  getSuccessRate(): number;
  getStats(): Record<string, any>;
}

// Machine Learning
export interface MLFeatures {
  [key: string]: number;
}

export interface SemanticAnalysis {
  semanticQuality: number;
  coherence: number;
  contextRelevance: number;
  anomalyLevel: number;
}

// Browser Configuration
export interface BrowserConfig {
  headless?: boolean;
  timeout?: number;
  maxPerHost?: number;
  additionalArgs?: string[];
}

// Crawler Configuration
export interface CrawlerConfig {
  maxConcurrent?: number;
  enableLearning?: boolean;
  enableDeepLearning?: boolean;
  browserConfig?: BrowserConfig;
}

// Statistics
export interface CrawlerStats {
  pagesCrawled: number;
  dataExtracted: number;
  errorsEncountered: number;
  totalProcessingTime: number;
  filterAgents?: Record<string, any>;
  mlEngine?: Record<string, any>;
  deepLearning?: Record<string, any>;
  storage?: Record<string, any>;
  monitoring?: Record<string, any>;
}

// API Request/Response Types
export interface CrawlRequest {
  urls: string[];
  extractionMethod?: 'browser' | 'http';
  extractionTargets?: ExtractionTarget[];
  filterConfig?: Record<string, any>;
}

export interface CrawlResponse {
  success: boolean;
  results: CrawlResult[];
  stats: CrawlerStats;
  error?: string;
}

export interface FeedbackRequest {
  data: any;
  liked: boolean;
  context?: Record<string, any>;
}

export interface SemanticSearchRequest {
  query: string;
  k?: number;
}

export interface SemanticSearchResponse {
  results: Array<{
    text: string;
    score: number;
  }>;
}

// Storage Types
export interface StoredResult {
  id?: number;
  url: string;
  data: string;
  dataType: string;
  confidence: number;
  semanticQuality?: number;
  coherenceScore?: number;
  contextScore?: number;
  anomalyScore?: number;
  extractionTime: number;
  timestamp?: string;
  metadata?: string;
  vectorId?: number;
}

// Monitoring Types
export interface PerformanceMetric {
  timestamp: number;
  value: number;
}

export interface Alert {
  timestamp: number;
  message: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  context: Record<string, any>;
}

export interface PerformanceReport {
  timestamp: number;
  summary: {
    totalPages: number;
    totalData: number;
    avgSuccessRate: number;
    systemHealth: number;
  };
  agentPerformance: Record<string, any>;
  recommendations: string[];
}