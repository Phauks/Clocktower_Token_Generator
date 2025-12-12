/**
 * Cache module - Pre-rendering cache system with Hexagonal Architecture.
 * Exports all cache types, interfaces, implementations, and utilities.
 */

// Core types and interfaces (Domain layer - Ports)
export type {
  CacheEntry,
  CacheStats,
  CacheOptions,
  CacheEventType,
  CacheEvent,
  PreRenderContextType,
  PreRenderContext,
  PreRenderResult,
  ICacheStrategy,
  IEvictionPolicy,
  IPreRenderStrategy
} from './core/index.js'

// Adapters (Infrastructure layer)
export { LRUCacheAdapter } from './adapters/LRUCacheAdapter.js'
export type { LRUCacheAdapterOptions, EvictionEvent } from './adapters/LRUCacheAdapter.js'

// Eviction policies (Infrastructure layer)
export { LRUEvictionPolicy } from './policies/LRUEvictionPolicy.js'
export type { LRUEvictionPolicyOptions } from './policies/LRUEvictionPolicy.js'

// Strategies (Domain services)
export { GalleryPreRenderStrategy } from './strategies/GalleryPreRenderStrategy.js'
export type { GalleryStrategyOptions } from './strategies/GalleryPreRenderStrategy.js'

export { CustomizePreRenderStrategy } from './strategies/CustomizePreRenderStrategy.js'
export type {
  CustomizeStrategyOptions,
  CustomizePreRenderEntry
} from './strategies/CustomizePreRenderStrategy.js'

export { ProjectPreRenderStrategy } from './strategies/ProjectPreRenderStrategy.js'
export type { ProjectStrategyOptions } from './strategies/ProjectPreRenderStrategy.js'

// Manager (Application layer)
export { PreRenderCacheManager } from './manager/PreRenderCacheManager.js'
export type { PreRenderCacheManagerEvents } from './manager/PreRenderCacheManager.js'

// Invalidation Coordinator (Application layer)
export { CacheInvalidationService, cacheInvalidationService } from './CacheInvalidationService.js'
export type {
  InvalidationScope,
  InvalidationEvent,
  InvalidationListener,
  InvalidationSubscription
} from './CacheInvalidationService.js'

// Cache Manager Facade (Application layer)
export { CacheManager, cacheManager } from './CacheManager.js'
export type { CombinedCacheStats, CacheWarmingOptions } from './CacheManager.js'

// Warming Policies (Application layer)
export {
  WarmingPolicyManager,
  warmingPolicyManager,
  ProjectOpenWarmingPolicy,
  AppStartWarmingPolicy
} from './policies/WarmingPolicy.js'
export type {
  WarmingPolicy,
  AppContext,
  WarmingResult
} from './policies/WarmingPolicy.js'

// Utilities
export {
  estimateSize,
  estimateMapMemory,
  formatBytes
} from './utils/memoryEstimator.js'

export { CacheLogger, CacheLogLevel } from './utils/CacheLogger.js'
export type { CachePerformanceMetrics } from './utils/CacheLogger.js'
