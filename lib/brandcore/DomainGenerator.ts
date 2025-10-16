/**
 * Advanced Domain Generator with AI Integration
 */

import { EnhancedUniversalCrawler } from '../crawler/EnhancedUniversalCrawler';
import { 
  DomainGenerationConfig, 
  DomainResult, 
  GenerationProgress, 
  BrandabilityMetrics,
  SemanticAnalysis,
  AvailabilityCheck,
  GenerationStats,
  IndustryField,
  WordType
} from '@/types/brandcore';
import { logger } from '@/lib/utils/logger';

export class AdvancedDomainGenerator {
  private crawler: EnhancedUniversalCrawler;
  private wordDatabase: Set<string>;
  private semanticCache: Map<string, SemanticAnalysis>;
  private availabilityCache: Map<string, AvailabilityCheck>;

  constructor() {
    this.crawler = new EnhancedUniversalCrawler({
      maxConcurrent: 3,
      enableLearning: true,
      enableDeepLearning: true,
    });
    this.wordDatabase = new Set();
    this.semanticCache = new Map();
    this.availabilityCache = new Map();
  }

  async initialize(): Promise<void> {
    await this.crawler.initialize({ headless: true });
    await this.loadWordDatabase();
    logger.info('Advanced Domain Generator initialized');
  }

  async generateDomains(config: DomainGenerationConfig, onProgress?: (progress: GenerationProgress) => void): Promise<DomainResult[]> {
    const startTime = Date.now();
    const results: DomainResult[] = [];
    
    try {
      // Stage 1: Initialization
      onProgress?.({
        stage: 'initializing',
        progress: 0,
        message: 'Initializing generation engine...',
      });

      // Stage 2: Word Collection
      onProgress?.({
        stage: 'scraping',
        progress: 10,
        message: 'Collecting words from sources...',
      });

      const words = await this.collectWords(config);
      
      // Stage 3: Analysis
      onProgress?.({
        stage: 'analyzing',
        progress: 30,
        message: 'Analyzing word patterns and semantics...',
      });

      const analyzedWords = await this.analyzeWords(words, config);
      
      // Stage 4: Filtering
      onProgress?.({
        stage: 'filtering',
        progress: 60,
        message: 'Applying advanced filters...',
      });

      const filteredWords = this.applyFilters(analyzedWords, config);
      
      // Stage 5: Availability Checking
      onProgress?.({
        stage: 'checking',
        progress: 80,
        message: 'Checking domain availability...',
      });

      for (let i = 0; i < filteredWords.length; i++) {
        const word = filteredWords[i];
        onProgress?.({
          stage: 'checking',
          progress: 80 + (i / filteredWords.length) * 15,
          message: `Checking ${word}...`,
          currentDomain: word,
        });

        const result = await this.createDomainResult(word, config);
        if (result) {
          results.push(result);
        }
      }

      // Stage 6: Completion
      onProgress?.({
        stage: 'completed',
        progress: 100,
        message: `Generated ${results.length} premium domains`,
      });

      const stats: GenerationStats = {
        totalGenerated: words.length,
        passedFilters: filteredWords.length,
        checkedAvailability: results.length,
        availableDomains: results.filter(r => this.hasAvailableTld(r)).length,
        processingTime: Date.now() - startTime,
        sourcesUsed: this.getSourcesUsed(config),
        averageScore: results.reduce((sum, r) => sum + r.score, 0) / Math.max(1, results.length),
        topScore: Math.max(...results.map(r => r.score), 0),
      };

      // Add stats to results metadata
      results.forEach(result => {
        result.metadata.processingTime = Date.now() - startTime;
      });

      return results.sort((a, b) => b.score - a.score);

    } catch (error) {
      logger.error('Domain generation failed:', error);
      throw error;
    }
  }

  private async collectWords(config: DomainGenerationConfig): Promise<string[]> {
    const words: string[] = [];

    if (config.mode === 'fast') {
      // Fast mode: Use local sources only
      words.push(...await this.getLocalWords(config));
    } else {
      // Advanced mode: Use web scraping + local sources
      words.push(...await this.getLocalWords(config));
      words.push(...await this.getWebWords(config));
    }

    // Remove duplicates and apply basic filters
    return [...new Set(words)]
      .filter(word => this.isValidWord(word, config))
      .slice(0, config.mode === 'fast' ? 1000 : 5000);
  }

  private async getLocalWords(config: DomainGenerationConfig): Promise<string[]> {
    const words: string[] = [];
    
    // Load from built-in dictionaries
    words.push(...this.getDictionaryWords(config));
    words.push(...this.getGeneratedWords(config));
    
    return words;
  }

  private async getWebWords(config: DomainGenerationConfig): Promise<string[]> {
    const words: string[] = [];
    
    try {
      // Scrape from online dictionaries and word sources
      const sources = [
        'https://www.merriam-webster.com/word-of-the-day',
        'https://dictionary.cambridge.org/inspiration/dictionary',
        'https://www.vocabulary.com/lists/155723',
      ];

      for (const source of sources) {
        try {
          const results = await this.crawler.crawlUrl(source, 'http');
          const extractedWords = this.extractWordsFromContent(results);
          words.push(...extractedWords);
        } catch (error) {
          logger.warning(`Failed to scrape ${source}:`, error);
        }
      }
    } catch (error) {
      logger.error('Web scraping failed:', error);
    }

    return words;
  }

  private getDictionaryWords(config: DomainGenerationConfig): string[] {
    // Built-in word lists
    const commonWords = [
      'zenith', 'nexus', 'vortex', 'quantum', 'synergy', 'paradox', 'catalyst', 'paradigm',
      'eclipse', 'horizon', 'odyssey', 'genesis', 'matrix', 'vector', 'prism', 'cosmos',
      'flux', 'pulse', 'spark', 'glow', 'beam', 'ray', 'core', 'hub', 'peak', 'summit',
      'forge', 'craft', 'build', 'make', 'create', 'design', 'shape', 'form', 'mold',
      'flow', 'stream', 'river', 'ocean', 'wave', 'tide', 'current', 'drift', 'cascade',
      'nova', 'stellar', 'cosmic', 'orbital', 'gravity', 'planet', 'star', 'galaxy', 'nebula',
      'tech', 'code', 'data', 'byte', 'pixel', 'vector', 'matrix', 'cloud', 'node', 'link',
      'brand', 'logo', 'mark', 'sign', 'symbol', 'icon', 'emblem', 'crest', 'badge',
    ];

    return this.filterWordsByConfig(commonWords, config);
  }

  private getGeneratedWords(config: DomainGenerationConfig): string[] {
    const generated: string[] = [];
    const prefixes = ['zen', 'neo', 'ultra', 'mega', 'hyper', 'super', 'meta', 'proto'];
    const suffixes = ['ify', 'ify', 'ize', 'ise', 'ex', 'ix', 'ox', 'on', 'um', 'us'];
    const roots = ['tech', 'core', 'hub', 'net', 'link', 'flow', 'spark', 'glow', 'beam'];

    // Generate combinations
    for (const prefix of prefixes) {
      for (const root of roots) {
        generated.push(prefix + root);
      }
    }

    for (const root of roots) {
      for (const suffix of suffixes) {
        generated.push(root + suffix);
      }
    }

    return this.filterWordsByConfig(generated, config);
  }

  private extractWordsFromContent(crawlResults: any[]): string[] {
    const words: string[] = [];
    
    for (const result of crawlResults) {
      if (typeof result.data === 'string') {
        const extracted = result.data
          .toLowerCase()
          .match(/\b[a-z]{4,10}\b/g) || [];
        words.push(...extracted);
      }
    }

    return [...new Set(words)];
  }

  private filterWordsByConfig(words: string[], config: DomainGenerationConfig): string[] {
    return words.filter(word => {
      // Length filter
      if (word.length < config.lengthRange[0] || word.length > config.lengthRange[1]) {
        return false;
      }

      // Starting letter filter
      if (config.startingLetter && !word.toLowerCase().startsWith(config.startingLetter.toLowerCase())) {
        return false;
      }

      // Exclude words
      if (config.excludeWords.some(exclude => word.toLowerCase().includes(exclude.toLowerCase()))) {
        return false;
      }

      // Include words (if specified)
      if (config.includeWords.length > 0 && 
          !config.includeWords.some(include => word.toLowerCase().includes(include.toLowerCase()))) {
        return false;
      }

      return true;
    });
  }

  private async analyzeWords(words: string[], config: DomainGenerationConfig): Promise<Array<{word: string, analysis: SemanticAnalysis}>> {
    const analyzed = [];

    for (const word of words) {
      let analysis = this.semanticCache.get(word);
      
      if (!analysis) {
        analysis = await this.analyzeWord(word, config);
        this.semanticCache.set(word, analysis);
      }

      analyzed.push({ word, analysis });
    }

    return analyzed;
  }

  private async analyzeWord(word: string, config: DomainGenerationConfig): Promise<SemanticAnalysis> {
    // Use AI to analyze word semantics
    const meaning = await this.getWordMeaning(word);
    const category = this.categorizeWord(word, config.industry);
    const sentiment = this.analyzeSentiment(word);
    const uniqueness = this.calculateUniqueness(word);
    const concepts = this.extractConcepts(word);
    const associations = this.getAssociations(word);

    return {
      meaning,
      category,
      sentiment,
      uniqueness,
      concepts,
      associations,
    };
  }

  private async getWordMeaning(word: string): Promise<string> {
    // Simplified meaning extraction - in production, use dictionary API
    const meanings: Record<string, string> = {
      'zenith': 'The highest point or peak',
      'nexus': 'A connection or series of connections',
      'vortex': 'A powerful rotating current',
      'quantum': 'The smallest possible amount',
      'synergy': 'Combined effort greater than individual parts',
      'paradox': 'A seemingly contradictory statement',
      'catalyst': 'Something that causes change',
      'paradigm': 'A typical example or pattern',
    };

    return meanings[word.toLowerCase()] || `A unique and memorable word: ${word}`;
  }

  private categorizeWord(word: string, industry: IndustryField): string {
    const industryKeywords = industry.keywords;
    const wordLower = word.toLowerCase();

    for (const keyword of industryKeywords) {
      if (wordLower.includes(keyword) || keyword.includes(wordLower)) {
        return industry.name;
      }
    }

    return 'General';
  }

  private analyzeSentiment(word: string): number {
    // Simple sentiment analysis
    const positiveWords = ['zenith', 'nexus', 'spark', 'glow', 'peak', 'summit', 'nova', 'stellar'];
    const negativeWords = ['void', 'dark', 'gloom', 'doom'];

    const wordLower = word.toLowerCase();
    
    if (positiveWords.some(pos => wordLower.includes(pos))) return 0.8;
    if (negativeWords.some(neg => wordLower.includes(neg))) return -0.5;
    
    return 0.1; // Neutral
  }

  private calculateUniqueness(word: string): number {
    // Calculate uniqueness based on letter patterns and rarity
    const uniqueLetters = new Set(word.toLowerCase()).size;
    const letterRatio = uniqueLetters / word.length;
    const commonPatterns = /(tion|ment|ness|ing|ed|er|or)$/i;
    
    let uniqueness = letterRatio;
    if (!commonPatterns.test(word)) uniqueness += 0.2;
    if (word.length >= 6) uniqueness += 0.1;
    
    return Math.min(1.0, uniqueness);
  }

  private extractConcepts(word: string): string[] {
    const concepts: string[] = [];
    
    // Extract conceptual associations
    if (word.includes('tech') || word.includes('code')) concepts.push('Technology');
    if (word.includes('flow') || word.includes('stream')) concepts.push('Movement');
    if (word.includes('glow') || word.includes('spark')) concepts.push('Light');
    if (word.includes('core') || word.includes('hub')) concepts.push('Center');
    if (word.includes('nova') || word.includes('stellar')) concepts.push('Space');
    
    return concepts;
  }

  private getAssociations(word: string): string[] {
    const associations: string[] = [];
    
    // Get word associations
    const associationMap: Record<string, string[]> = {
      'zenith': ['peak', 'top', 'summit', 'apex'],
      'nexus': ['connection', 'hub', 'center', 'network'],
      'vortex': ['spiral', 'whirlpool', 'rotation', 'energy'],
      'quantum': ['physics', 'science', 'particle', 'energy'],
      'synergy': ['teamwork', 'collaboration', 'unity', 'combined'],
    };

    return associationMap[word.toLowerCase()] || [];
  }

  private applyFilters(analyzedWords: Array<{word: string, analysis: SemanticAnalysis}>, config: DomainGenerationConfig): string[] {
    return analyzedWords
      .filter(({ word, analysis }) => {
        // Brandability score filter
        const brandability = this.calculateBrandability(word);
        if (brandability.score < config.brandabilityScore / 100) {
          return false;
        }

        // Rarity filter
        if (analysis.uniqueness < config.rarityRange[0] / 10 || 
            analysis.uniqueness > config.rarityRange[1] / 10) {
          return false;
        }

        // Word type filter
        if (config.wordType.id !== 'any' && !this.matchesWordType(word, config.wordType)) {
          return false;
        }

        return true;
      })
      .map(({ word }) => word)
      .slice(0, 100); // Limit to top 100 candidates
  }

  private calculateBrandability(word: string): BrandabilityMetrics {
    const length = word.length;
    const phonetics = this.calculatePhoneticScore(word);
    const uniqueness = this.calculateUniqueness(word);
    const memorability = this.calculateMemorability(word);
    const brandPotential = this.calculateBrandPotential(word);
    const marketability = this.calculateMarketability(word);

    const score = (length * 0.1 + phonetics * 0.2 + uniqueness * 0.2 + 
                   memorability * 0.2 + brandPotential * 0.15 + marketability * 0.15) / 100;

    return {
      score: Math.min(1.0, score),
      factors: {
        length: Math.max(0, 1 - Math.abs(length - 6) / 6),
        phonetics,
        uniqueness,
        memorability,
        brandPotential,
        marketability,
      },
    };
  }

  private calculatePhoneticScore(word: string): number {
    // Simple phonetic analysis
    const vowelRatio = (word.match(/[aeiou]/gi) || []).length / word.length;
    const consonantClusters = (word.match(/[bcdfghjklmnpqrstvwxyz]{2,}/gi) || []).length;
    
    let score = vowelRatio * 0.5;
    if (consonantClusters <= 1) score += 0.3;
    if (word.match(/^[^aeiou]/i)) score += 0.2;
    
    return Math.min(1.0, score);
  }

  private calculateMemorability(word: string): number {
    // Calculate how memorable a word is
    let score = 0.5;
    
    // Alliteration potential
    if (word[0] === word[word.length - 1]) score += 0.2;
    
    // Rhythm and flow
    const syllables = this.countSyllables(word);
    if (syllables >= 2 && syllables <= 3) score += 0.3;
    
    return Math.min(1.0, score);
  }

  private calculateBrandPotential(word: string): number {
    // Calculate brand potential
    let score = 0.5;
    
    // Avoid negative connotations
    const negativeWords = ['bad', 'ugly', 'poor', 'fail', 'wrong'];
    if (!negativeWords.some(neg => word.includes(neg))) score += 0.3;
    
    // Positive brand qualities
    const positiveQualities = ['zen', 'nova', 'prime', 'pro', 'max', 'ultra'];
    if (positiveQualities.some(qual => word.includes(qual))) score += 0.2;
    
    return Math.min(1.0, score);
  }

  private calculateMarketability(word: string): number {
    // Calculate marketability
    let score = 0.5;
    
    // Easy to spell
    if (word.match(/^[a-z]+$/i)) score += 0.2;
    
    // Easy to pronounce
    if (this.countSyllables(word) <= 3) score += 0.2;
    
    // Not too common or too rare
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all'];
    if (!commonWords.includes(word.toLowerCase())) score += 0.1;
    
    return Math.min(1.0, score);
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let count = 0;
    let prevWasVowel = false;
    
    for (const char of word) {
      const isVowel = vowels.includes(char);
      if (isVowel && !prevWasVowel) count++;
      prevWasVowel = isVowel;
    }
    
    return Math.max(1, count);
  }

  private matchesWordType(word: string, wordType: WordType): boolean {
    const pattern = new RegExp(wordType.pattern + '$', 'i');
    return pattern.test(word);
  }

  private async createDomainResult(word: string, config: DomainGenerationConfig): Promise<DomainResult | null> {
    try {
      const brandability = this.calculateBrandability(word);
      const semanticAnalysis = this.semanticCache.get(word) || await this.analyzeWord(word, config);
      const availability = await this.checkAvailability(word);
      
      const score = (brandability.score * 0.4 + 
                    semanticAnalysis.uniqueness * 0.3 + 
                    this.calculateAvailabilityScore(availability) * 0.3);

      return {
        domain: word,
        score,
        brandability: brandability.score,
        memorability: brandability.factors.memorability,
        pronounceability: brandability.factors.phonetics,
        availability,
        semanticAnalysis,
        metadata: {
          source: config.mode === 'fast' ? 'local' : 'web+local',
          generatedAt: new Date(),
          processingTime: 0,
        },
      };
    } catch (error) {
      logger.error(`Failed to create domain result for ${word}:`, error);
      return null;
    }
  }

  private async checkAvailability(domain: string): Promise<AvailabilityCheck> {
    const cacheKey = domain;
    
    if (this.availabilityCache.has(cacheKey)) {
      return this.availabilityCache.get(cacheKey)!;
    }

    // Simulate availability checking - in production, use domain APIs
    const tlds = ['com', 'net', 'org', 'io', 'ai', 'co'];
    const availability: Record<string, boolean> = {};
    
    for (const tld of tlds) {
      // Simulate API call with random availability
      availability[tld] = Math.random() > 0.7; // 30% chance of being available
    }

    const check: AvailabilityCheck = {
      domain,
      tlds: availability,
      premium: Math.random() > 0.9,
      price: Math.random() > 0.9 ? Math.floor(Math.random() * 10000) + 1000 : undefined,
      registrar: 'Namecheap',
    };

    this.availabilityCache.set(cacheKey, check);
    return check;
  }

  private calculateAvailabilityScore(availability: AvailabilityCheck): number {
    const availableCount = Object.values(availability.tlds).filter(Boolean).length;
    const totalCount = Object.keys(availability.tlds).length;
    return availableCount / totalCount;
  }

  private hasAvailableTld(result: DomainResult): boolean {
    return Object.values(result.availability.tlds).some(Boolean);
  }

  private isValidWord(word: string, config: DomainGenerationConfig): boolean {
    // Basic validation
    if (!word || word.length < config.lengthRange[0] || word.length > config.lengthRange[1]) {
      return false;
    }

    if (!/^[a-z]+$/i.test(word)) {
      return false;
    }

    return true;
  }

  private getSourcesUsed(config: DomainGenerationConfig): string[] {
    return config.mode === 'fast' 
      ? ['Local Dictionary', 'Generated Words']
      : ['Local Dictionary', 'Generated Words', 'Web Scraping', 'Online Dictionaries'];
  }

  private async loadWordDatabase(): Promise<void> {
    // Load word database from file or API
    // For now, use built-in words
    this.wordDatabase = new Set(this.getDictionaryWords({
      mode: 'fast',
      industry: { id: 'general', name: 'General', keywords: [], patterns: [] },
      wordType: { id: 'any', name: 'Any', pattern: '[a-z]+' },
      lengthRange: [4, 8],
      rarityRange: [1, 10],
      brandabilityScore: 70,
      startingLetter: '',
      excludeWords: [],
      includeWords: [],
    }));
  }

  async close(): Promise<void> {
    await this.crawler.close();
  }
}