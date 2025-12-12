/**
 * Background Removal Service
 *
 * AI-powered background removal using MediaPipe Selfie Segmentation
 * Runs entirely client-side with no API costs or usage limits
 */

import type { BackgroundRemovalOptions } from '../types/index.js';

/**
 * Background Removal Service
 *
 * Uses MediaPipe Selfie Segmentation for automatic background removal.
 * Model is lazy-loaded on first use and cached for subsequent operations.
 */
export class BackgroundRemovalService {
  private model: any = null; // SelfieSegmentation type from @mediapipe/selfie_segmentation
  private isLoading: boolean = false;
  private loadingPromise: Promise<void> | null = null;

  /**
   * Initialize the ML model (lazy-loaded on first use)
   */
  async initialize(): Promise<void> {
    // If already loaded or currently loading, return existing promise
    if (this.model) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.isLoading = true;

    this.loadingPromise = (async () => {
      try {
        // Dynamic import MediaPipe Selfie Segmentation
        // NOTE: Requires @mediapipe/selfie_segmentation package installed
        const { SelfieSegmentation } = await import('@mediapipe/selfie_segmentation');

        this.model = new SelfieSegmentation({
          locateFile: (file: string) => {
            // Use CDN for model files to avoid bundling large files
            return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
          }
        });

        // Configure model options
        this.model.setOptions({
          modelSelection: 1, // 0 = general, 1 = landscape (better for varied subjects)
          selfieMode: false,
        });

        await this.model.initialize();
        console.log('Background removal model initialized successfully');
      } catch (error) {
        console.error('Failed to load background removal model:', error);
        console.warn(
          'Background removal requires @mediapipe/selfie_segmentation package. ' +
          'Run: npm install @mediapipe/selfie_segmentation'
        );
        this.model = null;
        throw error;
      } finally {
        this.isLoading = false;
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  /**
   * Remove background from image
   */
  async removeBackground(
    imageData: ImageData,
    options: BackgroundRemovalOptions = {}
  ): Promise<ImageData> {
    // Initialize model if needed
    if (!this.model && !this.isLoading) {
      await this.initialize();
    }

    if (!this.model) {
      throw new Error('Background removal model not loaded');
    }

    const {
      threshold = 0.5,
      featherEdges = true,
      edgeRadius = 2,
      invertMask = false
    } = options;

    try {
      // Create temporary canvas for MediaPipe processing
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(imageData, 0, 0);

      // Run segmentation
      const results = await new Promise<any>((resolve, reject) => {
        this.model.onResults((results: any) => resolve(results));
        this.model.send({ image: canvas }).catch(reject);
      });

      // Get segmentation mask
      const maskCanvas = results.segmentationMask;
      const maskCtx = maskCanvas.getContext('2d')!;
      const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

      // Apply mask to original image
      const output = this.applySegmentationMask(imageData, maskData, {
        threshold,
        featherEdges,
        edgeRadius,
        invertMask
      });

      return output;
    } catch (error) {
      console.error('Background removal failed:', error);
      throw error;
    }
  }

  /**
   * Apply segmentation mask to image
   */
  private applySegmentationMask(
    imageData: ImageData,
    maskData: ImageData,
    options: Required<BackgroundRemovalOptions>
  ): ImageData {
    const { threshold, featherEdges, edgeRadius, invertMask } = options;

    // Create output image data
    const output = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    // Apply mask to alpha channel
    for (let i = 0; i < maskData.data.length; i += 4) {
      // Get mask value (0-255)
      const maskValue = maskData.data[i]; // R channel (mask is grayscale)

      // Normalize to 0-1
      const normalizedMask = maskValue / 255;

      // Apply threshold
      let alpha = normalizedMask > threshold ? 1 : 0;

      // Invert if requested
      if (invertMask) {
        alpha = 1 - alpha;
      }

      // Set alpha channel
      const pixelIndex = i;
      output.data[pixelIndex + 3] = Math.round(alpha * 255);
    }

    // Apply edge feathering if requested
    if (featherEdges && edgeRadius > 0) {
      return this.featherEdges(output, edgeRadius);
    }

    return output;
  }

  /**
   * Feather edges for smoother transitions
   */
  private featherEdges(imageData: ImageData, radius: number): ImageData {
    const output = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    const width = imageData.width;
    const height = imageData.height;

    // Simple box blur on alpha channel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;

        // Sample surrounding pixels
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const index = (ny * width + nx) * 4;
              sum += imageData.data[index + 3]; // Alpha channel
              count++;
            }
          }
        }

        const avgAlpha = sum / count;
        const index = (y * width + x) * 4;
        output.data[index + 3] = avgAlpha;
      }
    }

    return output;
  }

  /**
   * Manual background removal using a user-painted mask
   */
  manualRemoval(imageData: ImageData, maskData: ImageData): ImageData {
    const output = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    // Apply mask to alpha channel
    for (let i = 0; i < maskData.data.length; i += 4) {
      const maskAlpha = maskData.data[i + 3]; // Alpha channel of mask
      const currentAlpha = imageData.data[i + 3];

      // Combine original alpha with mask alpha
      output.data[i + 3] = Math.round((currentAlpha * maskAlpha) / 255);
    }

    return output;
  }

  /**
   * Check if model is loaded
   */
  isModelLoaded(): boolean {
    return this.model !== null;
  }

  /**
   * Check if model is currently loading
   */
  isModelLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Unload the model to free memory
   */
  async dispose(): Promise<void> {
    if (this.model) {
      try {
        await this.model.close();
      } catch (error) {
        console.error('Error disposing background removal model:', error);
      }
      this.model = null;
    }
  }
}

/**
 * Singleton instance for convenience
 */
export const backgroundRemovalService = new BackgroundRemovalService();
