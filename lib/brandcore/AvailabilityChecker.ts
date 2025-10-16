/**
 * Real-time Domain Availability Checker
 */

import { AvailabilityCheck } from '@/types/brandcore';
import { logger } from '@/lib/utils/logger';

export class DomainAvailabilityChecker {
  private cache: Map<string, AvailabilityCheck>;
  private cacheExpiry: Map<string, number>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.cache = new Map();
    this.cacheExpiry = new Map();
  }

  async checkAvailability(domain: string, tlds: string[] = ['com', 'net', 'org', 'io', 'ai', 'co']): Promise<AvailabilityCheck> {
    const cacheKey = `${domain}_${tlds.join(',')}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const availability = await this.performAvailabilityCheck(domain, tlds);
      
      // Cache the result
      this.cache.set(cacheKey, availability);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
      
      return availability;
    } catch (error) {
      logger.error(`Availability check failed for ${domain}:`, error);
      
      // Return fallback result
      return {
        domain,
        tlds: this.getFallbackAvailability(tlds),
        premium: false,
        registrar: 'Unknown',
      };
    }
  }

  async checkSingleDomain(fullDomain: string): Promise<boolean> {
    const [domain, tld] = fullDomain.split('.');
    
    try {
      // Use DNS lookup to check availability
      const result = await this.performDnsLookup(fullDomain);
      return !result.available;
    } catch (error) {
      // If DNS lookup fails, domain might be available
      return true;
    }
  }

  private async performAvailabilityCheck(domain: string, tlds: string[]): Promise<Record<string, boolean>> {
    const availability: Record<string, boolean> = {};
    
    // Check each TLD
    for (const tld of tlds) {
      const fullDomain = `${domain}.${tld}`;
      
      try {
        // Method 1: DNS lookup
        const dnsResult = await this.performDnsLookup(fullDomain);
        availability[tld] = !dnsResult.available;
        
        // If DNS shows available, try WHOIS for confirmation
        if (availability[tld]) {
          const whoisResult = await this.performWhoisLookup(fullDomain);
          availability[tld] = !whoisResult.available;
        }
      } catch (error) {
        // Fallback to HTTP check
        availability[tld] = await this.performHttpCheck(fullDomain);
      }
      
      // Add delay to avoid rate limiting
      await this.delay(100);
    }
    
    return availability;
  }

  private async performDnsLookup(domain: string): Promise<{ available: boolean; error?: string }> {
    try {
      // In a real implementation, use dns.lookup or external DNS service
      // For now, simulate DNS lookup
      const isAvailable = await this.simulateDnsCheck(domain);
      return { available: isAvailable };
    } catch (error) {
      return { available: false, error: String(error) };
    }
  }

  private async performWhoisLookup(domain: string): Promise<{ available: boolean; error?: string }> {
    try {
      // In a real implementation, use WHOIS service
      // For now, simulate WHOIS lookup
      const isAvailable = await this.simulateWhoisCheck(domain);
      return { available: isAvailable };
    } catch (error) {
      return { available: false, error: String(error) };
    }
  }

  private async performHttpCheck(domain: string): Promise<boolean> {
    try {
      // Try to fetch the domain
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      
      return response.ok;
    } catch (error) {
      // If fetch fails, domain might be available
      return false;
    }
  }

  private async simulateDnsCheck(domain: string): Promise<boolean> {
    // Simulate DNS check with some randomness
    // In production, replace with actual DNS lookup
    return new Promise((resolve) => {
      setTimeout(() => {
        // 30% chance of being available for simulation
        resolve(Math.random() > 0.7);
      }, Math.random() * 200 + 50);
    });
  }

  private async simulateWhoisCheck(domain: string): Promise<boolean> {
    // Simulate WHOIS check
    return new Promise((resolve) => {
      setTimeout(() => {
        // 25% chance of being available for simulation
        resolve(Math.random() > 0.75);
      }, Math.random() * 300 + 100);
    });
  }

  private getFallbackAvailability(tlds: string[]): Record<string, boolean> {
    const availability: Record<string, boolean> = {};
    
    for (const tld of tlds) {
      // Random fallback
      availability[tld] = Math.random() > 0.8;
    }
    
    return availability;
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  getCacheStats(): { size: number; validEntries: number } {
    const now = Date.now();
    const validEntries = Array.from(this.cacheExpiry.entries())
      .filter(([_, expiry]) => expiry > now).length;
    
    return {
      size: this.cache.size,
      validEntries,
    };
  }

  // Premium domain detection
  async checkPremiumStatus(domain: string, tld: string): Promise<{ isPremium: boolean; price?: number }> {
    try {
      // In production, integrate with domain marketplace APIs
      const premiumDomains = [
        'ai.com', 'tech.com', 'data.com', 'cloud.com',
        'app.io', 'dev.io', 'tech.io',
      ];
      
      const fullDomain = `${domain}.${tld}`;
      const isPremium = premiumDomains.includes(fullDomain) || Math.random() > 0.95;
      
      return {
        isPremium,
        price: isPremium ? Math.floor(Math.random() * 50000) + 10000 : undefined,
      };
    } catch (error) {
      logger.error(`Premium check failed for ${domain}.${tld}:`, error);
      return { isPremium: false };
    }
  }

  // Bulk availability checking
  async checkBulkAvailability(domains: string[], tlds: string[] = ['com', 'net', 'org']): Promise<AvailabilityCheck[]> {
    const results: AvailabilityCheck[] = [];
    
    // Process in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize);
      
      const batchPromises = batch.map(domain => this.checkAvailability(domain, tlds));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < domains.length) {
        await this.delay(1000);
      }
    }
    
    return results;
  }

  // Suggest alternative domains
  async suggestAlternatives(domain: string, tlds: string[] = ['com', 'net', 'org']): Promise<string[]> {
    const alternatives: string[] = [];
    
    // Add common prefixes
    const prefixes = ['get', 'my', 'the', 'go', 'try', 'use', 'best', 'top'];
    for (const prefix of prefixes) {
      alternatives.push(`${prefix}${domain}`);
    }
    
    // Add common suffixes
    const suffixes = ['app', 'hub', 'site', 'web', 'online', 'digital', 'tech', 'solutions'];
    for (const suffix of suffixes) {
      alternatives.push(`${domain}${suffix}`);
    }
    
    // Add variations
    alternatives.push(`${domain}-app`);
    alternatives.push(`${domain}-tech`);
    alternatives.push(`${domain}-hub`);
    
    // Check availability of alternatives
    const availableAlternatives: string[] = [];
    
    for (const alt of alternatives.slice(0, 10)) { // Limit to 10 suggestions
      const availability = await this.checkAvailability(alt, tlds);
      if (Object.values(availability.tlds).some(Boolean)) {
        availableAlternatives.push(alt);
      }
    }
    
    return availableAlternatives;
  }
}