/**
 * Studio Debugger - Temporary component to diagnose layer loss
 *
 * Add this to StudioView to see what's happening with layers
 */

import { useEffect } from 'react';
import { useStudio } from '../../contexts/StudioContext';

export function StudioDebugger() {
  const { layers } = useStudio();

  // Log layer changes
  useEffect(() => {
    console.log('[DEBUG StudioDebugger] Layers changed:', {
      timestamp: new Date().toISOString(),
      count: layers.length,
      layerIds: layers.map(l => l.id),
      layerNames: layers.map(l => l.name),
      hasCanvases: layers.map(l => l.canvas instanceof HTMLCanvasElement),
      canvasSizes: layers.map(l => ({
        width: l.canvas?.width,
        height: l.canvas?.height,
        hasPixels: l.canvas?.width > 0 && l.canvas?.height > 0
      })),
      stackTrace: new Error().stack?.split('\n').slice(2, 5).join('\n')
    });
  }, [layers]);

  // Log on mount/unmount
  useEffect(() => {
    console.log('[DEBUG StudioDebugger] MOUNTED');
    return () => {
      console.log('[DEBUG StudioDebugger] UNMOUNTED');
    };
  }, []);

  // Show visual debug info
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: '#0f0',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 9999,
      border: '2px solid #0f0',
      borderRadius: '4px',
      maxWidth: '300px'
    }}>
      <div><strong>Studio Debug Info</strong></div>
      <div>Layers: {layers.length}</div>
      {layers.map((layer, i) => (
        <div key={layer.id} style={{ marginLeft: '10px', fontSize: '10px' }}>
          [{i}] {layer.name} - {layer.canvas?.width}x{layer.canvas?.height}
        </div>
      ))}
    </div>
  );
}
