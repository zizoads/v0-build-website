/**
 * Enhanced BrandCore Dashboard with AI Integration
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, 
  Globe, 
  TrendingUp, 
  Clock, 
  Settings, 
  Download,
  Star,
  Search,
  Filter,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  Target,
  Brain,
  Shield
} from 'lucide-react';
import { 
  DomainGenerationConfig, 
  DomainResult, 
  GenerationProgress,
  IndustryField,
  WordType,
  SUPPORTED_TLDS,
  INDUSTRY_FIELDS,
  WORD_TYPES
} from '@/types/brandcore';

export default function BrandCoreDashboard() {
  const [config, setConfig] = useState<DomainGenerationConfig>({
    mode: 'fast',
    industry: INDUSTRY_FIELDS[0],
    wordType: WORD_TYPES[0],
    lengthRange: [4, 9],
    rarityRange: [1, 10],
    brandabilityScore: 70,
    startingLetter: '',
    excludeWords: [],
    includeWords: [],
  });

  const [results, setResults] = useState<DomainResult[]>([]);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTlds, setSelectedTlds] = useState(['com', 'io', 'ai']);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResults, setFilteredResults] = useState<DomainResult[]>([]);

  // Filter results based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredResults(results);
    } else {
      const filtered = results.filter(result => 
        result.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.semanticAnalysis.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.semanticAnalysis.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredResults(filtered);
    }
  }, [results, searchTerm]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setProgress(null);
    setResults([]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'progress') {
                  setProgress(data.data);
                } else if (data.type === 'complete') {
                  setResults(data.data);
                  setProgress({
                    stage: 'completed',
                    progress: 100,
                    message: `Generated ${data.data.length} premium domains`,
                  });
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      setProgress({
        stage: 'completed',
        progress: 0,
        message: `Error: ${error.message}`,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [config]);

  const handleExport = useCallback(async (format: 'json' | 'csv' | 'xlsx') => {
    const exportData = filteredResults.map(result => ({
      domain: result.domain,
      score: result.score,
      brandability: result.brandability,
      availability: Object.entries(result.availability.tlds)
        .filter(([_, available]) => available)
        .map(([tld]) => tld)
        .join(', '),
      meaning: result.semanticAnalysis.meaning,
      category: result.semanticAnalysis.category,
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brandcore-domains-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const csv = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brandcore-domains-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [filteredResults]);

  const getProgressIcon = () => {
    if (!progress) return <Settings className="w-5 h-5" />;
    
    switch (progress.stage) {
      case 'initializing': return <Brain className="w-5 h-5" />;
      case 'scraping': return <Globe className="w-5 h-5" />;
      case 'analyzing': return <BarChart3 className="w-5 h-5" />;
      case 'filtering': return <Filter className="w-5 h-5" />;
      case 'checking': return <Search className="w-5 h-5" />;
      case 'completed': return progress.progress === 100 ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const getProgressColor = () => {
    if (!progress) return 'text-gray-400';
    if (progress.stage === 'completed') {
      return progress.progress === 100 ? 'text-green-500' : 'text-red-500';
    }
    return 'text-blue-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            BrandCore Intelligence v5.0
          </h1>
          <p className="text-gray-300 text-lg">
            AI-Powered Domain Generation with Advanced Web Crawling & Semantic Analysis
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Generation Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Generation Mode</label>
              <div className="space-y-2">
                <label className="flex items-center p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    value="fast"
                    checked={config.mode === 'fast'}
                    onChange={(e) => setConfig({ ...config, mode: e.target.value as 'fast' | 'advanced' })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Fast Mode</div>
                    <div className="text-xs text-gray-400">~10-30s • Local sources • Good quality</div>
                  </div>
                </label>
                <label className="flex items-center p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    value="advanced"
                    checked={config.mode === 'advanced'}
                    onChange={(e) => setConfig({ ...config, mode: e.target.value as 'fast' | 'advanced' })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Advanced Mode</div>
                    <div className="text-xs text-gray-400">~1-3min • Web scraping • Premium quality</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Industry Field */}
            <div>
              <label className="block text-sm font-medium mb-3">Industry Field</label>
              <select
                value={config.industry.id}
                onChange={(e) => {
                  const industry = INDUSTRY_FIELDS.find(f => f.id === e.target.value);
                  if (industry) setConfig({ ...config, industry });
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {INDUSTRY_FIELDS.map(field => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>
            </div>

            {/* Word Type */}
            <div>
              <label className="block text-sm font-medium mb-3">Word Type</label>
              <select
                value={config.wordType.id}
                onChange={(e) => {
                  const wordType = WORD_TYPES.find(t => t.id === e.target.value);
                  if (wordType) setConfig({ ...config, wordType });
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {WORD_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            {/* Length Range */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Length Range: {config.lengthRange[0]} - {config.lengthRange[1]} characters
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={config.lengthRange[0]}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    lengthRange: [parseInt(e.target.value), config.lengthRange[1]] 
                  })}
                  className="w-full"
                />
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={config.lengthRange[1]}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    lengthRange: [config.lengthRange[0], parseInt(e.target.value)] 
                  })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Brandability Score */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Brandability Score: {config.brandabilityScore}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={config.brandabilityScore}
                onChange={(e) => setConfig({ ...config, brandabilityScore: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Starting Letter */}
            <div>
              <label className="block text-sm font-medium mb-3">Starting Letter (Optional)</label>
              <input
                type="text"
                maxLength={1}
                value={config.startingLetter}
                onChange={(e) => setConfig({ ...config, startingLetter: e.target.value.toUpperCase() })}
                placeholder="A-Z"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-6">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  Generate Premium Domains
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Display */}
        {progress && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className={getProgressColor()}>
                {getProgressIcon()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{progress.message}</h3>
                {progress.currentDomain && (
                  <p className="text-sm text-gray-400">Processing: {progress.currentDomain}</p>
                )}
              </div>
              <div className="text-2xl font-bold">{progress.progress}%</div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6" />
                Generated Domains ({filteredResults.length})
              </h2>
              
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search domains..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Export */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('json')}
                    className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
              {filteredResults.map((result, index) => (
                <div key={index} className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-purple-300">{result.domain}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm">{(result.score * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Brain className="w-4 h-4 text-blue-400" />
                          <span className="text-sm">{(result.brandability * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {Object.entries(result.availability.tlds).map(([tld, available]) => (
                        <div
                          key={tld}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            available 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                          title={`.${tld} ${available ? 'Available' : 'Taken'}`}
                        >
                          {tld.slice(0, 2)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Meaning:</span>
                      <p className="text-gray-200">{result.semanticAnalysis.meaning}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-gray-400">Category:</span>
                        <span className="ml-1 text-gray-200">{result.semanticAnalysis.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Uniqueness:</span>
                        <span className="ml-1 text-gray-200">{(result.semanticAnalysis.uniqueness * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    {result.semanticAnalysis.concepts.length > 0 && (
                      <div>
                        <span className="text-gray-400">Concepts:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.semanticAnalysis.concepts.map((concept, i) => (
                            <span key={i} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Showcase */}
        {results.length === 0 && !isGenerating && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <Brain className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="font-bold mb-2">AI-Powered Analysis</h3>
              <p className="text-sm text-gray-400">Advanced semantic analysis with deep learning models for meaningful domain suggestions</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <Globe className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="font-bold mb-2">Web Crawling</h3>
              <p className="text-sm text-gray-400">Real-time web scraping from dictionaries and word sources for unique discoveries</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <Shield className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="font-bold mb-2">Availability Check</h3>
              <p className="text-sm text-gray-400">Instant domain availability checking across multiple TLDs with premium detection</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <TrendingUp className="w-8 h-8 text-pink-400 mb-4" />
              <h3 className="font-bold mb-2">Brandability Score</h3>
              <p className="text-sm text-gray-400">Machine learning algorithms to score domain brand potential and marketability</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}