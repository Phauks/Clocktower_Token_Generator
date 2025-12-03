/**
 * Blood on the Clocktower Token Generator
 * QR Code Generation Utilities
 */

import { QR_COLORS, TIMING } from '../constants.js';

// ============================================================================
// QR CODE TYPES
// ============================================================================

/**
 * QR code library constructor interface
 */
export interface QRCodeConstructor {
    new (container: HTMLElement, options: {
        text: string;
        width: number;
        height: number;
        colorDark: string;
        colorLight: string;
        correctLevel: number;
    }): void;
}

/**
 * QR code generation options
 */
export interface QRCodeOptions {
    text: string;
    size: number;
    colorDark?: string;
    colorLight?: string;
    correctLevel?: number;
}

// ============================================================================
// QR CODE GENERATION
// ============================================================================

/**
 * Generate a QR code canvas
 * @param options - QR code generation options
 * @returns Promise resolving to a canvas with the QR code
 */
export async function generateQRCode(options: QRCodeOptions): Promise<HTMLCanvasElement> {
    const {
        text,
        size,
        colorDark = QR_COLORS.DARK,
        colorLight = QR_COLORS.LIGHT,
        correctLevel = QR_COLORS.ERROR_CORRECTION_LEVEL
    } = options;

    return new Promise((resolve, reject) => {
        const QRCodeLib = (window as Window & { QRCode?: QRCodeConstructor }).QRCode;
        if (!QRCodeLib) {
            reject(new Error('QRCode library not loaded'));
            return;
        }

        const container = document.createElement('div');
        container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
        document.body.appendChild(container);

        try {
            new QRCodeLib(container, {
                text,
                width: size,
                height: size,
                colorDark,
                colorLight,
                correctLevel
            });

            setTimeout(() => {
                const qrCanvas = container.querySelector('canvas');
                if (qrCanvas) {
                    // Clone the canvas to avoid issues when container is removed
                    const resultCanvas = document.createElement('canvas');
                    resultCanvas.width = qrCanvas.width;
                    resultCanvas.height = qrCanvas.height;
                    const resultCtx = resultCanvas.getContext('2d');
                    if (resultCtx) {
                        resultCtx.drawImage(qrCanvas, 0, 0);
                    }
                    document.body.removeChild(container);
                    resolve(resultCanvas);
                } else {
                    document.body.removeChild(container);
                    reject(new Error('Failed to generate QR code canvas'));
                }
            }, TIMING.QR_GENERATION_DELAY);
        } catch (error) {
            document.body.removeChild(container);
            reject(error);
        }
    });
}
