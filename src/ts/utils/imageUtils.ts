/**
 * Blood on the Clocktower Token Generator
 * Image Utility Functions
 */

import type { CorsProxyOption } from '../types/index.js';

// ============================================================================
// CORS PROXY CONFIGURATION
// ============================================================================

// TODO: Replace allorigins with Cloudflare Workers proxy for better reliability
const ALLORIGINS_PROXY = 'https://api.allorigins.win/raw?url=';

/**
 * Global CORS proxy setting - singleton for non-React code access
 */
let corsProxySetting: CorsProxyOption = 'allorigins';

/**
 * Set the global CORS proxy setting (called from React context)
 */
export function setCorsProxySetting(setting: CorsProxyOption): void {
    corsProxySetting = setting;
}

/**
 * Get the current CORS proxy setting
 */
export function getCorsProxySetting(): CorsProxyOption {
    return corsProxySetting;
}

// ============================================================================
// IMAGE LOADING
// ============================================================================

/**
 * Try to load an image directly (with CORS)
 */
function tryDirectLoad(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = (): void => resolve(img);
        img.onerror = (): void => {
            img.src = ''; // Clean up to prevent memory leak
            reject(new Error('CORS'));
        };
        img.src = url;
    });
}

/**
 * Try to load an image via CORS proxy
 */
function tryProxyLoad(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = (): void => resolve(img);
        img.onerror = (): void => {
            img.src = ''; // Clean up to prevent memory leak
            reject(new Error(`Failed to load image via proxy: ${url}`));
        };
        img.src = ALLORIGINS_PROXY + encodeURIComponent(url);
    });
}

/**
 * Load an image from URL with CORS handling and automatic proxy fallback
 * @param url - Image URL
 * @returns Loaded image element
 */
export async function loadImage(url: string): Promise<HTMLImageElement> {
    // Skip proxy logic for data URLs and local paths
    if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('./')) {
        return tryDirectLoad(url);
    }
    
    try {
        // Try direct load first (faster when CORS works)
        return await tryDirectLoad(url);
    } catch (error) {
        // If direct load failed and proxy is enabled, try proxy
        if (corsProxySetting !== 'disabled') {
            try {
                return await tryProxyLoad(url);
            } catch (proxyError) {
                throw new Error(`Failed to load image from: ${url}. Direct load and proxy both failed.`);
            }
        }
        // Proxy disabled, throw original error
        throw new Error(`Failed to load image from: ${url}. This may be due to CORS restrictions or the image not being accessible.`);
    }
}

/**
 * Load an image from local path
 * @param path - Local file path
 * @returns Loaded image element
 */
export async function loadLocalImage(path: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = (): void => resolve(img);
        img.onerror = (): void => {
            img.src = ''; // Clean up to prevent memory leak
            reject(new Error(`Failed to load local image: ${path}`));
        };
        img.src = path;
    });
}

/**
 * Convert canvas to blob
 * @param canvas - Canvas element
 * @param type - MIME type
 * @param quality - Quality (0-1)
 * @returns Image blob
 */
export async function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string = 'image/png',
    quality: number = 1
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to convert canvas to blob'));
            }
        }, type, quality);
    });
}

/**
 * Download a file
 * @param data - File data (Blob or data URL)
 * @param filename - Download filename
 */
export function downloadFile(data: Blob | string, filename: string): void {
    const link = document.createElement('a');
    if (data instanceof Blob) {
        link.href = URL.createObjectURL(data);
    } else {
        link.href = data;
    }
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (data instanceof Blob) {
        URL.revokeObjectURL(link.href);
    }
}

/**
 * Check if fonts are loaded
 * @param fontNames - Array of font names to check
 * @returns Whether fonts are loaded
 */
export async function checkFontsLoaded(fontNames: string[]): Promise<boolean> {
    if (!document.fonts) {
        // Fallback for older browsers
        return new Promise(resolve => setTimeout(() => resolve(true), 500));
    }

    try {
        await document.fonts.ready;
        const checks = fontNames.map(name => document.fonts.check(`16px "${name}"`));
        return checks.every(loaded => loaded);
    } catch {
        return false;
    }
}
