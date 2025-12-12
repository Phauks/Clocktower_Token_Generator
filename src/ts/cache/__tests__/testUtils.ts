/**
 * Cache Testing Utilities
 *
 * Mock factories and helpers for testing cache layers.
 * Provides easy setup for unit and integration tests.
 *
 * @module ts/cache/__tests__/testUtils
 */

import type { ICacheStrategy, CacheStats } from '../types.js';

// ============================================================================
// Mock Cache Implementation
// ============================================================================

/**
 * Create a mock cache for testing.
 * Implements ICacheStrategy with in-memory Map storage.
 *
 * @param entries - Optional initial entries as [key, value] pairs
 * @returns Mock cache instance
 *
 * @example
 * ```typescript
 * const cache = createMockCache<string, string>([
 *   ['key1', 'value1'],
 *   ['key2', 'value2']
 * ]);
 * ```
 */
export function createMockCache<K, V>(
  entries?: [K, V][]
): ICacheStrategy<K, V> {
  const storage = new Map<K, V>(entries || []);
  const accessTimes = new Map<K, number>();
  const tags = new Map<K, Set<string>>();
  let hitCount = 0;
  let missCount = 0;
  let evictionCount = 0;

  return {
    async get(key: K): Promise<V | null> {
      const value = storage.get(key);
      if (value !== undefined) {
        hitCount++;
        accessTimes.set(key, Date.now());
        return value;
      }
      missCount++;
      return null;
    },

    async set(key: K, value: V, cacheTags?: string[]): Promise<void> {
      storage.set(key, value);
      accessTimes.set(key, Date.now());

      if (cacheTags) {
        tags.set(key, new Set(cacheTags));
      }
    },

    async delete(key: K): Promise<boolean> {
      const existed = storage.has(key);
      storage.delete(key);
      accessTimes.delete(key);
      tags.delete(key);
      if (existed) evictionCount++;
      return existed;
    },

    async clear(): Promise<void> {
      storage.clear();
      accessTimes.clear();
      tags.clear();
    },

    async getStats(): Promise<CacheStats> {
      const totalCount = hitCount + missCount;
      return {
        size: storage.size,
        hitCount,
        missCount,
        hitRate: totalCount > 0 ? hitCount / totalCount : 0,
        evictionCount,
        memoryUsage: 0,
        maxSize: Infinity,
        maxMemory: Infinity
      };
    },

    async evict(count: number): Promise<number> {
      const entries = Array.from(storage.keys());
      const toEvict = entries.slice(0, Math.min(count, entries.length));

      for (const key of toEvict) {
        await this.delete(key);
      }

      return toEvict.length;
    },

    async invalidateByTag(tag: string): Promise<number> {
      let invalidated = 0;

      for (const [key, keyTags] of tags.entries()) {
        if (keyTags.has(tag)) {
          await this.delete(key);
          invalidated++;
        }
      }

      return invalidated;
    }
  };
}

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Create mock cache entries for testing.
 *
 * @param count - Number of entries to create
 * @param valueFactory - Optional factory function for values (default: `value-${index}`)
 * @returns Array of [key, value] pairs
 *
 * @example
 * ```typescript
 * const entries = createMockCacheEntries(10, (i) => ({ id: i, data: 'test' }));
 * const cache = createMockCache(entries);
 * ```
 */
export function createMockCacheEntries<V = string>(
  count: number,
  valueFactory?: (index: number) => V
): [string, V][] {
  const defaultFactory = (i: number) => `value-${i}` as unknown as V;
  const factory = valueFactory || defaultFactory;

  return Array.from({ length: count }, (_, i) => [
    `key-${i}`,
    factory(i)
  ]);
}

/**
 * Create mock token data URLs for cache testing.
 *
 * @param count - Number of token data URLs to generate
 * @returns Array of [filename, dataUrl] pairs
 *
 * @example
 * ```typescript
 * const tokens = createMockTokenUrls(5);
 * const cache = createMockCache(tokens);
 * ```
 */
export function createMockTokenUrls(count: number): [string, string][] {
  return Array.from({ length: count }, (_, i) => [
    `token-${i}.png`,
    `data:image/png;base64,mock-base64-data-${i}`
  ]);
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Populate a cache with mock entries and return stats.
 * Useful for setting up test scenarios quickly.
 *
 * @param cache - Cache instance to populate
 * @param entries - Entries to add
 * @returns Promise resolving when complete
 *
 * @example
 * ```typescript
 * const cache = createMockCache();
 * await populateCache(cache, createMockCacheEntries(100));
 * const stats = await cache.getStats();
 * expect(stats.size).toBe(100);
 * ```
 */
export async function populateCache<K, V>(
  cache: ICacheStrategy<K, V>,
  entries: [K, V][]
): Promise<void> {
  for (const [key, value] of entries) {
    await cache.set(key, value);
  }
}

/**
 * Simulate cache hits by accessing keys in order.
 * Updates hit/miss statistics for testing.
 *
 * @param cache - Cache instance
 * @param keys - Keys to access
 * @returns Array of retrieved values (null for misses)
 *
 * @example
 * ```typescript
 * const cache = createMockCache([['key1', 'value1']]);
 * const values = await simulateCacheAccess(cache, ['key1', 'key2', 'key1']);
 * // values: ['value1', null, 'value1']
 * // stats: { hits: 2, misses: 1 }
 * ```
 */
export async function simulateCacheAccess<K, V>(
  cache: ICacheStrategy<K, V>,
  keys: K[]
): Promise<(V | null)[]> {
  const results: (V | null)[] = [];

  for (const key of keys) {
    const value = await cache.get(key);
    results.push(value);
  }

  return results;
}

/**
 * Wait for condition to be true (polling helper).
 * Useful for testing async cache updates.
 *
 * @param condition - Function that returns true when done
 * @param timeout - Max time to wait in ms (default: 1000)
 * @param interval - Polling interval in ms (default: 50)
 * @returns Promise resolving when condition is met
 *
 * @example
 * ```typescript
 * await waitForCondition(async () => {
 *   const stats = await cache.getStats();
 *   return stats.size === 10;
 * });
 * ```
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 1000,
  interval: number = 50
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Measure execution time of a function.
 * Useful for performance testing.
 *
 * @param fn - Function to measure
 * @returns Object with result and duration in ms
 *
 * @example
 * ```typescript
 * const { result, duration } = await measureDuration(async () => {
 *   return await cache.get('key');
 * });
 * expect(duration).toBeLessThan(100);
 * ```
 */
export async function measureDuration<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  return { result, duration };
}

/**
 * Create a cache spy that tracks all method calls.
 * Useful for verifying cache behavior in tests.
 *
 * @param baseCache - Cache to wrap with spy
 * @returns Wrapped cache with call tracking
 *
 * @example
 * ```typescript
 * const { cache, calls } = createCacheSpy(createMockCache());
 * await cache.get('key');
 * expect(calls.get).toHaveLength(1);
 * ```
 */
export function createCacheSpy<K, V>(
  baseCache: ICacheStrategy<K, V>
): {
  cache: ICacheStrategy<K, V>;
  calls: Record<string, any[]>;
} {
  const calls: Record<string, any[]> = {
    get: [],
    set: [],
    delete: [],
    clear: [],
    evict: [],
    invalidateByTag: []
  };

  const cache: ICacheStrategy<K, V> = {
    async get(key: K): Promise<V | null> {
      calls.get.push({ key, timestamp: Date.now() });
      return baseCache.get(key);
    },

    async set(key: K, value: V, cacheTags?: string[]): Promise<void> {
      calls.set.push({ key, value, cacheTags, timestamp: Date.now() });
      return baseCache.set(key, value, cacheTags);
    },

    async delete(key: K): Promise<boolean> {
      calls.delete.push({ key, timestamp: Date.now() });
      return baseCache.delete(key);
    },

    async clear(): Promise<void> {
      calls.clear.push({ timestamp: Date.now() });
      return baseCache.clear();
    },

    async getStats(): Promise<CacheStats> {
      return baseCache.getStats();
    },

    async evict(count: number): Promise<number> {
      calls.evict.push({ count, timestamp: Date.now() });
      return baseCache.evict(count);
    },

    async invalidateByTag(tag: string): Promise<number> {
      calls.invalidateByTag.push({ tag, timestamp: Date.now() });
      return baseCache.invalidateByTag(tag);
    }
  };

  return { cache, calls };
}
