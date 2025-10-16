/**
 * Advanced Storage Engine with Database Support
 */

import Database from 'better-sqlite3';
import { CrawlResult, StoredResult, SemanticAnalysis } from '@/types';
import { logger } from '@/lib/utils/logger';
import path from 'path';

export class AdvancedStorageEngine {
  private db: Database.Database;
  private dbPath: string;
  private vectorMapping: Map<number, string>;

  constructor(dbPath: string = 'crawler_advanced.db') {
    this.dbPath = path.join(process.cwd(), 'data', dbPath);
    this.vectorMapping = new Map();
    this.initDatabase();
    logger.info(`Storage engine initialized with database: ${dbPath}`);
  }

  private initDatabase(): void {
    try {
      // Ensure data directory exists
      const fs = require('fs');
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new Database(this.dbPath);

      // Results table with quality analysis
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS crawl_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url TEXT NOT NULL,
          data TEXT NOT NULL,
          data_type TEXT NOT NULL,
          confidence REAL NOT NULL,
          semantic_quality REAL,
          coherence_score REAL,
          context_score REAL,
          anomaly_score REAL,
          extraction_time REAL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          metadata TEXT,
          vector_id INTEGER
        )
      `);

      // Create indexes
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_url ON crawl_results(url);
        CREATE INDEX IF NOT EXISTS idx_confidence ON crawl_results(confidence);
        CREATE INDEX IF NOT EXISTS idx_timestamp ON crawl_results(timestamp);
      `);

      // Vectors table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS vectors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vector_data BLOB NOT NULL,
          dimension INTEGER NOT NULL
        )
      `);

      // Learning statistics table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS learning_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          agent_name TEXT NOT NULL,
          success_rate REAL,
          adaptation_level REAL,
          strategy TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error(`Database initialization failed: ${error}`);
      throw error;
    }
  }

  async storeWithAnalysis(result: CrawlResult, semanticAnalysis: SemanticAnalysis): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO crawl_results 
        (url, data, data_type, confidence, semantic_quality, 
         coherence_score, context_score, anomaly_score, 
         extraction_time, metadata, vector_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        result.sourceUrl,
        JSON.stringify(result.data),
        'text',
        result.confidence,
        semanticAnalysis.semanticQuality,
        semanticAnalysis.coherence,
        semanticAnalysis.contextRelevance,
        semanticAnalysis.anomalyLevel,
        result.extractionTime,
        JSON.stringify(result.metadata),
        null
      );

      logger.debug(`Stored result with confidence ${result.confidence.toFixed(2)}`);
    } catch (error) {
      logger.error(`Storage with analysis failed: ${error}`);
    }
  }

  async storeResult(result: CrawlResult): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO crawl_results 
        (url, data, data_type, confidence, extraction_time, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        result.sourceUrl,
        JSON.stringify(result.data),
        'text',
        result.confidence,
        result.extractionTime,
        JSON.stringify(result.metadata)
      );

      logger.debug(`Stored result from ${result.sourceUrl}`);
    } catch (error) {
      logger.error(`Result storage failed: ${error}`);
    }
  }

  async getResults(limit: number = 100): Promise<StoredResult[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM crawl_results 
        ORDER BY timestamp DESC 
        LIMIT ?
      `);

      return stmt.all(limit) as StoredResult[];
    } catch (error) {
      logger.error(`Failed to retrieve results: ${error}`);
      return [];
    }
  }

  async searchResults(query: string, limit: number = 50): Promise<StoredResult[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM crawl_results 
        WHERE data LIKE ? OR url LIKE ?
        ORDER BY confidence DESC 
        LIMIT ?
      `);

      return stmt.all(`%${query}%`, `%${query}%`, limit) as StoredResult[];
    } catch (error) {
      logger.error(`Search failed: ${error}`);
      return [];
    }
  }

  getStats(): Record<string, any> {
    try {
      const totalResults = this.db.prepare('SELECT COUNT(*) as count FROM crawl_results').get() as { count: number };
      const avgConfidence = this.db.prepare('SELECT AVG(confidence) as avg FROM crawl_results').get() as { avg: number };
      const avgSemanticQuality = this.db.prepare('SELECT AVG(semantic_quality) as avg FROM crawl_results WHERE semantic_quality IS NOT NULL').get() as { avg: number };

      return {
        totalResults: totalResults.count,
        avgConfidence: avgConfidence.avg || 0,
        avgSemanticQuality: avgSemanticQuality.avg || 0,
        vectorDbSize: this.vectorMapping.size,
        vectorSearchAvailable: false,
      };
    } catch (error) {
      logger.error(`Failed to get storage stats: ${error}`);
      return {};
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      logger.info('Database connection closed');
    }
  }
}