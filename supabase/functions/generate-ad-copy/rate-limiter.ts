import { logger } from './logger.ts';

// In-memory rate limiter with sliding window algorithm
interface RateLimitEntry {
  count: number;
  windowStart: number;
  lastUpdated: number;
  dbSyncCount: number;
}

class RateLimiter {
  private cache: Map<string, RateLimitEntry>;
  private readonly WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CACHE_TTL_MS = 60 * 1000; // 1 minute
  private readonly DB_SYNC_INTERVAL = 10; // Sync to DB every 10 requests
  private readonly DAILY_LIMIT = 50;

  constructor() {
    this.cache = new Map();
    // Clean up stale entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
    logger.info('RateLimiter initialized', { dailyLimit: this.DAILY_LIMIT });
  }

  async checkLimit(userId: string, supabase: any): Promise<{ allowed: boolean; remaining: number }> {
    const key = userId;
    const now = Date.now();
    
    let entry = this.cache.get(key);
    
    // If no cache entry or cache expired, fetch from DB
    if (!entry || now - entry.lastUpdated > this.CACHE_TTL_MS) {
      entry = await this.fetchFromDB(userId, supabase);
      this.cache.set(key, entry);
    }
    
    // Check if we're in a new window
    if (now - entry.windowStart > this.WINDOW_MS) {
      entry.count = 0;
      entry.windowStart = now;
      entry.dbSyncCount = 0;
    }
    
    const allowed = entry.count < this.DAILY_LIMIT;
    
    if (allowed) {
      entry.count++;
      entry.dbSyncCount++;
      entry.lastUpdated = now;
      
      // Sync to DB every N requests or every 5 minutes
      const timeSinceLastUpdate = now - entry.windowStart;
      if (entry.dbSyncCount >= this.DB_SYNC_INTERVAL || timeSinceLastUpdate > 5 * 60 * 1000) {
        await this.syncToDB(userId, entry, supabase);
        entry.dbSyncCount = 0;
      }
    }
    
    const remaining = Math.max(0, this.DAILY_LIMIT - entry.count);
    return { allowed, remaining };
  }

  private async fetchFromDB(userId: string, supabase: any): Promise<RateLimitEntry> {
    try {
      const { data, error } = await supabase
        .from('api_usage')
        .select('request_count, request_date')
        .eq('user_id', userId)
        .eq('endpoint', 'generate-ad-copy')
        .eq('request_date', new Date().toISOString().split('T')[0])
        .single();
      
      if (error || !data) {
        logger.debug('No existing rate limit data found in DB', { userId });
        return {
          count: 0,
          windowStart: Date.now(),
          lastUpdated: Date.now(),
          dbSyncCount: 0,
        };
      }
      
      logger.debug('Rate limit data fetched from DB', { userId, count: data.request_count });
      return {
        count: data.request_count || 0,
        windowStart: Date.now(),
        lastUpdated: Date.now(),
        dbSyncCount: 0,
      };
    } catch (error) {
      logger.error('Error fetching rate limit from DB', error as Error, { userId });
      return {
        count: 0,
        windowStart: Date.now(),
        lastUpdated: Date.now(),
        dbSyncCount: 0,
      };
    }
  }

  private async syncToDB(userId: string, entry: RateLimitEntry, supabase: any): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('api_usage')
        .upsert({
          user_id: userId,
          endpoint: 'generate-ad-copy',
          request_count: entry.count,
          request_date: today,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint,request_date',
        });
      
      if (error) {
        logger.error('Error syncing rate limit to DB', error as Error, { userId });
      } else {
        logger.debug('Rate limit synced to DB', { userId, count: entry.count });
      }
    } catch (error) {
      logger.error('Error syncing to DB', error as Error, { userId });
    }
  }

  private cleanup(): void {
    const initialSize = this.cache.size;
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.lastUpdated > this.CACHE_TTL_MS * 2) {
        this.cache.delete(key);
      }
    }
    if (this.cache.size < initialSize) {
      logger.debug('Rate limiter cache cleaned', { 
        removed: initialSize - this.cache.size, 
        remaining: this.cache.size 
      });
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// IP-based rate limiting for DDoS protection
interface IPRateLimitEntry {
  count: number;
  windowStart: number;
  violations: number;
}

class IPRateLimiter {
  private cache: Map<string, IPRateLimitEntry>;
  private readonly WINDOW_MS = 60 * 60 * 1000; // 1 hour
  private readonly HOURLY_LIMIT = 100;
  private readonly BURST_LIMIT = 50; // 50 requests in 10 seconds triggers block
  private readonly BURST_WINDOW_MS = 10 * 1000;

  constructor() {
    this.cache = new Map();
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
    logger.info('IPRateLimiter initialized', { 
      hourlyLimit: this.HOURLY_LIMIT, 
      burstLimit: this.BURST_LIMIT 
    });
  }

  checkLimit(ip: string): { allowed: boolean; reason?: string } {
    if (!ip) return { allowed: true };

    const now = Date.now();
    let entry = this.cache.get(ip);
    
    if (!entry || now - entry.windowStart > this.WINDOW_MS) {
      entry = {
        count: 0,
        windowStart: now,
        violations: 0,
      };
      this.cache.set(ip, entry);
    }
    
    // Check for burst traffic
    if (entry.count > this.BURST_LIMIT && now - entry.windowStart < this.BURST_WINDOW_MS) {
      entry.violations++;
      logger.warn('Burst traffic detected', { ip, violations: entry.violations });
      return { allowed: false, reason: 'Burst traffic detected. Please slow down.' };
    }
    
    // Check hourly limit
    if (entry.count >= this.HOURLY_LIMIT) {
      return { allowed: false, reason: 'Hourly IP limit exceeded. Try again later.' };
    }
    
    entry.count++;
    return { allowed: true };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.cache.entries()) {
      if (now - entry.windowStart > this.WINDOW_MS * 2) {
        this.cache.delete(ip);
      }
    }
  }
}

export const ipRateLimiter = new IPRateLimiter();
