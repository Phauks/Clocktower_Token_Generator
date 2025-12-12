/**
 * Cache Inspector - Debug panel for cache visibility
 *
 * Provides a comprehensive view of all cache layers with:
 * - Real-time statistics
 * - Hit rates and memory usage
 * - Clear all and export report functions
 * - Smart recommendations
 *
 * DEV MODE ONLY - Hidden in production builds
 *
 * @module components/Debug/CacheInspector
 */

import React, { useState } from 'react';
import { useCacheStats, type CacheLayerStats } from '../../hooks/useCacheStats.js';

/**
 * Individual cache layer view component
 */
function CacheLayerView({ stats }: { stats: CacheLayerStats }) {
  const hitRateColor = (rate?: number) => {
    if (rate === undefined) return '#gray';
    if (rate > 0.7) return '#22c55e'; // green
    if (rate > 0.4) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        backgroundColor: '#f9fafb',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
        {stats.name}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Entries</div>
          <div style={{ fontSize: '20px', fontWeight: '700' }}>
            {stats.entryCount}
            {stats.maxSize && (
              <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                {' '}
                / {stats.maxSize}
              </span>
            )}
          </div>
        </div>

        {stats.hitRate !== undefined && (
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Hit Rate</div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: hitRateColor(stats.hitRate),
              }}
            >
              {(stats.hitRate * 100).toFixed(1)}%
            </div>
          </div>
        )}

        {stats.memoryUsageMB !== undefined && (
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Memory</div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>
              {stats.memoryUsageMB.toFixed(1)} MB
            </div>
          </div>
        )}

        {stats.hitCount !== undefined && stats.missCount !== undefined && (
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Hits / Misses</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {stats.hitCount} / {stats.missCount}
            </div>
          </div>
        )}

        {stats.evictionCount !== undefined && stats.evictionCount > 0 && (
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Evictions</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b' }}>
              {stats.evictionCount}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Recommendations panel component
 */
function RecommendationsPanel({ recommendations }: { recommendations: string[] }) {
  if (recommendations.length === 0) return null;

  const isAllGood = recommendations.length === 1 && recommendations[0].startsWith('✓');

  return (
    <div
      style={{
        border: `2px solid ${isAllGood ? '#22c55e' : '#f59e0b'}`,
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: isAllGood ? '#f0fdf4' : '#fffbeb',
        marginTop: '16px',
      }}
    >
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: isAllGood ? '#15803d' : '#b45309',
        }}
      >
        {isAllGood ? '✓ Status' : '⚠️ Recommendations'}
      </h3>

      <ul style={{ margin: 0, paddingLeft: '20px' }}>
        {recommendations.map((rec, index) => (
          <li
            key={index}
            style={{
              fontSize: '14px',
              marginBottom: '8px',
              color: isAllGood ? '#15803d' : '#92400e',
            }}
          >
            {rec}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Cache Inspector Panel
 *
 * Dev-mode debug panel for visualizing cache statistics.
 * Includes real-time stats, actions, and recommendations.
 *
 * @example
 * ```tsx
 * // Only render in development
 * {import.meta.env.DEV && <CacheInspector />}
 * ```
 */
export function CacheInspector() {
  const { stats, isLoading, refresh, clearAllCaches, exportReport } = useCacheStats({
    refreshInterval: 2000,
    includeRecommendations: true,
  });

  const [isMinimized, setIsMinimized] = useState(false);

  // Don't render in production
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: isMinimized ? 'auto' : '400px',
        maxHeight: '80vh',
        backgroundColor: 'white',
        border: '2px solid #3b82f6',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        zIndex: 9999,
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
          🔍 Cache Inspector
        </h2>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0 4px',
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(!isMinimized);
          }}
        >
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>

      {/* Content (hidden when minimized) */}
      {!isMinimized && (
        <div style={{ padding: '16px', maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
          {/* Summary */}
          <div
            style={{
              backgroundColor: '#eff6ff',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Total Memory Usage
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e40af' }}>
              {stats.totalMemoryMB.toFixed(1)} MB
            </div>
          </div>

          {/* Cache Layers */}
          <CacheLayerView stats={stats.preRender} />
          <CacheLayerView stats={stats.imageCache} />
          <CacheLayerView stats={stats.fontCache} />
          <CacheLayerView stats={stats.assetUrls} />

          {/* Recommendations */}
          <RecommendationsPanel recommendations={stats.recommendations} />

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '16px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={refresh}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? 'Refreshing...' : '🔄 Refresh'}
            </button>

            <button
              onClick={clearAllCaches}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              🗑️ Clear All
            </button>

            <button
              onClick={exportReport}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              📊 Export
            </button>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid #e5e7eb',
              fontSize: '11px',
              color: '#9ca3af',
              textAlign: 'center',
            }}
          >
            Auto-refreshes every 2 seconds • Dev mode only
          </div>
        </div>
      )}
    </div>
  );
}

export default CacheInspector;
