'use client';

/**
 * Crawler Dashboard Component
 */

import React, { useState } from 'react';
import { Search, Activity, Database, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface CrawlResult {
  data: any;
  confidence: number;
  sourceUrl: string;
  extractionTime: number;
}

interface CrawlerStats {
  pagesCrawled: number;
  dataExtracted: number;
  errorsEncountered: number;
  totalProcessingTime: number;
}

export default function CrawlerDashboard() {
  const [urls, setUrls] = useState<string>('');
  const [results, setResults] = useState<CrawlResult[]>([]);
  const [stats, setStats] = useState<CrawlerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionMethod, setExtractionMethod] = useState<'browser' | 'http'>('browser');

  const handleCrawl = async () => {
    setLoading(true);
    setError(null);

    try {
      const urlList = urls
        .split('\n')
        .map(u => u.trim())
        .filter(u => u.length > 0);

      if (urlList.length === 0) {
        setError('Please enter at least one URL');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: urlList,
          extractionMethod,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        setStats(data.stats);
      } else {
        setError(data.error || 'Crawling failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (result: CrawlResult, liked: boolean) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: result.data,
          liked,
          context: {
            sourceUrl: result.sourceUrl,
            confidence: result.confidence,
          },
        }),
      });
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Enhanced Universal Web Crawler
          </h1>
          <p className="text-gray-400">
            Advanced web scraping with AI-powered filtering and semantic analysis
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-xl">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">URLs to Crawl (one per line)</label>
            <textarea
              className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com&#10;https://another-site.com"
              value={urls}
              onChange={e => setUrls(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Extraction Method</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="browser"
                  checked={extractionMethod === 'browser'}
                  onChange={e => setExtractionMethod(e.target.value as 'browser')}
                  className="mr-2"
                />
                Browser (JavaScript support)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="http"
                  checked={extractionMethod === 'http'}
                  onChange={e => setExtractionMethod(e.target.value as 'http')}
                  className="mr-2"
                />
                HTTP (Faster)
              </label>
            </div>
          </div>

          <button
            onClick={handleCrawl}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Crawling...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Start Crawling
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pages Crawled</p>
                  <p className="text-2xl font-bold">{stats.pagesCrawled}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Data Extracted</p>
                  <p className="text-2xl font-bold">{stats.dataExtracted}</p>
                </div>
                <Database className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Errors</p>
                  <p className="text-2xl font-bold">{stats.errorsEncountered}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Processing Time</p>
                  <p className="text-2xl font-bold">{(stats.totalProcessingTime / 1000).toFixed(1)}s</p>
                </div>
                <Activity className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Extracted Results ({results.length})</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                          Confidence: {(result.confidence * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-400">
                          {result.extractionTime.toFixed(0)}ms
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        {typeof result.data === 'string'
                          ? result.data.length > 200
                            ? result.data.substring(0, 200) + '...'
                            : result.data
                          : JSON.stringify(result.data).substring(0, 200)}
                      </p>
                      <p className="text-xs text-gray-500">{result.sourceUrl}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleFeedback(result, true)}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                        title="Good result"
                      >
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </button>
                      <button
                        onClick={() => handleFeedback(result, false)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                        title="Bad result"
                      >
                        <XCircle className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}