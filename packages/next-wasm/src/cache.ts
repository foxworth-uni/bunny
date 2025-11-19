import { createHash } from 'crypto';
import { serialize } from './serialize.js';
import type { SerializeOptions, SerializeResult } from './types.js';

/**
 * Cache entry for compiled MDX
 */
interface CacheEntry<TFrontmatter = Record<string, any>> {
  compiledSource: string;
  frontmatter?: TFrontmatter;
  images?: string[];
  timestamp: number;
}

/**
 * LRU cache for compiled MDX content
 */
class MDXCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 500, ttl = 1000 * 60 * 60) {
    this.maxSize = maxSize;
    this.ttl = ttl; // Default: 1 hour
  }

  /**
   * Generate a cache key from source content
   */
  getCacheKey(source: string): string {
    return createHash('sha256').update(source).digest('hex');
  }

  /**
   * Get cached entry if it exists and is not expired
   */
  get<TFrontmatter = Record<string, any>>(
    source: string
  ): CacheEntry<TFrontmatter> | null {
    const key = this.getCacheKey(source);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry as CacheEntry<TFrontmatter>;
  }

  /**
   * Set cache entry
   */
  set<TFrontmatter = Record<string, any>>(
    source: string,
    value: Omit<CacheEntry<TFrontmatter>, 'timestamp'>
  ): void {
    const key = this.getCacheKey(source);

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      ...value,
      timestamp: Date.now(),
    } as CacheEntry);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Configure cache settings
   */
  configure(options: { maxSize?: number; ttl?: number }): void {
    if (options.maxSize !== undefined) {
      this.maxSize = options.maxSize;
    }
    if (options.ttl !== undefined) {
      this.ttl = options.ttl;
    }
  }
}

// Global cache instance
export const mdxCache = new MDXCache();

/**
 * Serialize MDX with caching
 *
 * This is a drop-in replacement for serialize() that adds caching.
 * Compiled MDX is cached based on source hash.
 *
 * @example
 * ```ts
 * const mdxSource = await serializeWithCache(content);
 * ```
 */
export async function serializeWithCache<
  TScope = Record<string, unknown>,
  TFrontmatter = Record<string, any>
>(
  source: string,
  options?: SerializeOptions<TScope>
): Promise<SerializeResult<TScope, TFrontmatter>> {
  // Check cache first
  const cached = mdxCache.get<TFrontmatter>(source);

  if (cached) {
    return {
      ...cached,
      scope: options?.scope,
    };
  }

  // Cache miss - compile
  const result = await serialize<TScope, TFrontmatter>(source, options);

  // Store in cache
  mdxCache.set<TFrontmatter>(source, {
    compiledSource: result.compiledSource,
    frontmatter: result.frontmatter,
    images: result.images,
  });

  return result;
}

/**
 * Configure the global MDX cache
 *
 * @example
 * ```ts
 * configureMDXCache({
 *   maxSize: 1000,
 *   ttl: 1000 * 60 * 30 // 30 minutes
 * });
 * ```
 */
export function configureMDXCache(options: {
  maxSize?: number;
  ttl?: number;
}): void {
  mdxCache.configure(options);
}

/**
 * Clear the global MDX cache
 */
export function clearMDXCache(): void {
  mdxCache.clear();
}

