/**
 * Blood on the Clocktower Token Generator
 * PNG Exporter - Single PNG download functionality
 */

import { canvasToBlob } from '../utils/index.js';
import { embedPngMetadata, buildTokenMetadata } from './pngMetadata.js';
import type { Token, PngExportOptions } from '../types/index.js';

/**
 * Download a single token as PNG
 * @param token - Token object with canvas
 * @param pngSettings - Optional PNG export settings
 */
export async function downloadTokenPNG(
    token: Token,
    pngSettings?: PngExportOptions
): Promise<void> {
    let blob = await canvasToBlob(token.canvas);

    // Embed metadata if enabled
    if (pngSettings?.embedMetadata) {
        const metadata = buildTokenMetadata(token);
        blob = await embedPngMetadata(blob, metadata);
    }

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${token.filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}
