/**
 * BrandCore System Type Definitions
 */

export interface DomainGenerationConfig {
  mode: 'fast' | 'advanced';
  industry: IndustryField;
  wordType: WordType;
  lengthRange: [number, number];
  rarityRange: [number, number];
  brandabilityScore: number;
  startingLetter: string;
  excludeWords: string[];
  includeWords: string[];
}

export interface DomainResult {
  domain: string;
  score: number;
  brandability: number;
  memorability: number;
  pronounceability: number;
  availability: {
    com: boolean;
    net: boolean;
    org: boolean;
    io: boolean;
    ai: boolean;
    co: boolean;
  };
  semanticAnalysis: {
    meaning: string;
    category: string;
    sentiment: number;
    uniqueness: number;
  };
  metadata: {
    source: string;
    generatedAt: Date;
    processingTime: number;
  };
}

export interface IndustryField {
  id: string;
  name: string;
  keywords: string[];
  patterns: string[];
}

export interface WordType {
  id: string;
  name: string;
  pattern: string;
}

export interface GenerationProgress {
  stage: 'initializing' | 'scraping' | 'analyzing' | 'filtering' | 'checking' | 'completed';
  progress: number;
  message: string;
  eta?: number;
  currentDomain?: string;
}

export interface BrandabilityMetrics {
  score: number;
  factors: {
    length: number;
    phonetics: number;
    uniqueness: number;
    memorability: number;
    brandPotential: number;
    marketability: number;
  };
}

export interface SemanticAnalysis {
  meaning: string;
  category: string;
  sentiment: number;
  uniqueness: number;
  concepts: string[];
  associations: string[];
}

export interface AvailabilityCheck {
  domain: string;
  tlds: Record<string, boolean>;
  premium: boolean;
  price?: number;
  registrar?: string;
}

export interface GenerationStats {
  totalGenerated: number;
  passedFilters: number;
  checkedAvailability: number;
  availableDomains: number;
  processingTime: number;
  sourcesUsed: string[];
  averageScore: number;
  topScore: number;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  includeAvailability: boolean;
  includeAnalysis: boolean;
  sortBy: 'score' | 'domain' | 'availability';
  sortOrder: 'asc' | 'desc';
}

export interface UserPreferences {
  defaultMode: 'fast' | 'advanced';
  preferredTlds: string[];
  maxResults: number;
  autoSave: boolean;
  notifications: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface GenerationHistory {
  id: string;
  config: DomainGenerationConfig;
  results: DomainResult[];
  stats: GenerationStats;
  timestamp: Date;
  userId?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WebSocketMessage {
  type: 'progress' | 'result' | 'error' | 'complete';
  data: any;
  timestamp: Date;
}

// Industry definitions
export const INDUSTRY_FIELDS: IndustryField[] = [
  {
    id: 'general',
    name: 'General English',
    keywords: ['general', 'common', 'universal', 'global'],
    patterns: ['[a-z]{4,8}'],
  },
  {
    id: 'technology',
    name: 'Technology / Computing',
    keywords: ['tech', 'digital', 'software', 'hardware', 'ai', 'data'],
    patterns: ['[a-z]{4,10}'],
  },
  {
    id: 'business',
    name: 'Business / Finance',
    keywords: ['business', 'finance', 'money', 'trade', 'market'],
    patterns: ['[a-z]{4,9}'],
  },
  {
    id: 'creative',
    name: 'Creative / Design',
    keywords: ['creative', 'design', 'art', 'visual', 'brand'],
    patterns: ['[a-z]{4,8}'],
  },
  {
    id: 'science',
    name: 'Science / Nature',
    keywords: ['science', 'nature', 'research', 'bio', 'eco'],
    patterns: ['[a-z]{5,10}'],
  },
];

// Word type definitions
export const WORD_TYPES: WordType[] = [
  {
    id: 'any',
    name: 'Any Type',
    pattern: '[a-z]+',
  },
  {
    id: 'noun',
    name: 'Noun',
    pattern: '[a-z]*(?:tion|ment|ness|ity|er|or|ist|ism|ship|hood|acy)',
  },
  {
    id: 'verb',
    name: 'Verb',
    pattern: '[a-z]*(?:ing|ed|es|ify|ize|ate|ise)',
  },
  {
    id: 'adjective',
    name: 'Adjective',
    pattern: '[a-z]*(?:ful|less|able|ible|al|ial|ic|ive|ous)',
  },
  {
    id: 'adverb',
    name: 'Adverb',
    pattern: '[a-z]*(?:ly|wise|wards|ward)',
  },
];

// TLD definitions
export const SUPPORTED_TLDS = [
  { id: 'com', name: '.com', popular: true },
  { id: 'net', name: '.net', popular: true },
  { id: 'org', name: '.org', popular: true },
  { id: 'io', name: '.io', popular: true },
  { id: 'ai', name: '.ai', popular: true },
  { id: 'co', name: '.co', popular: true },
  { id: 'app', name: '.app', popular: false },
  { id: 'dev', name: '.dev', popular: false },
  { id: 'tech', name: '.tech', popular: false },
  { id: 'store', name: '.store', popular: false },
];