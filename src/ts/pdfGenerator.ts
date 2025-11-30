/**
 * Blood on the Clocktower Token Generator
 * PDF Generator - PDF export functionality
 */

import CONFIG from './config.js';
import { TEAM_LABELS } from './config.js';
import { canvasToBlob } from './utils.js';
import { embedPngMetadata, type PngMetadata } from './png-metadata.js';
import type { Token, PDFOptions, TokenLayoutItem, ProgressCallback, jsPDFDocument, JSZipInstance, ZipExportOptions, PngExportOptions } from './types/index.js';

/**
 * PDFGenerator class handles PDF creation and layout
 */
export class PDFGenerator {
    private options: PDFOptions;
    private pageWidthPx: number;
    private pageHeightPx: number;
    private marginPx: number;
    private usableWidth: number;
    private usableHeight: number;

    constructor(options: Partial<PDFOptions> = {}) {
        this.options = {
            pageWidth: options.pageWidth ?? CONFIG.PDF.PAGE_WIDTH,
            pageHeight: options.pageHeight ?? CONFIG.PDF.PAGE_HEIGHT,
            dpi: options.dpi ?? CONFIG.PDF.DPI,
            margin: options.margin ?? CONFIG.PDF.MARGIN,
            tokenPadding: options.tokenPadding ?? CONFIG.PDF.TOKEN_PADDING,
            xOffset: options.xOffset ?? CONFIG.PDF.X_OFFSET,
            yOffset: options.yOffset ?? CONFIG.PDF.Y_OFFSET
        };

        // Calculate usable area in pixels at 300 DPI
        this.pageWidthPx = this.options.pageWidth * this.options.dpi;
        this.pageHeightPx = this.options.pageHeight * this.options.dpi;
        this.marginPx = this.options.margin * this.options.dpi;

        // Usable area
        this.usableWidth = this.pageWidthPx - (2 * this.marginPx);
        this.usableHeight = this.pageHeightPx - (2 * this.marginPx);
    }

    /**
     * Update generator options
     * @param newOptions - New options to apply
     */
    updateOptions(newOptions: Partial<PDFOptions>): void {
        this.options = { ...this.options, ...newOptions };

        // Recalculate dimensions
        this.pageWidthPx = this.options.pageWidth * this.options.dpi;
        this.pageHeightPx = this.options.pageHeight * this.options.dpi;
        this.marginPx = this.options.margin * this.options.dpi;
        this.usableWidth = this.pageWidthPx - (2 * this.marginPx);
        this.usableHeight = this.pageHeightPx - (2 * this.marginPx);
    }

    /**
     * Calculate grid layout for tokens
     * @param tokens - Array of token objects with canvas
     * @param separateByType - Whether to separate character and reminder tokens onto different pages
     * @returns Array of pages with token positions
     */
    calculateGridLayout(tokens: Token[], separateByType: boolean = true): TokenLayoutItem[][] {
        if (!separateByType) {
            return this.calculateSingleLayout(tokens);
        }

        // Separate tokens by type
        const characterTokens = tokens.filter(t =>
            t.type === 'character' || t.type === 'script-name' ||
            t.type === 'almanac' || t.type === 'pandemonium'
        );
        const reminderTokens = tokens.filter(t => t.type === 'reminder');

        // Layout each group separately
        const charPages = this.calculateSingleLayout(characterTokens);
        const reminderPages = this.calculateSingleLayout(reminderTokens);

        // Character pages first, then reminder pages
        return [...charPages, ...reminderPages];
    }

    /**
     * Calculate grid layout for a single array of tokens
     * @param tokens - Array of token objects with canvas
     * @returns Array of pages with token positions
     */
    private calculateSingleLayout(tokens: Token[]): TokenLayoutItem[][] {
        const pages: TokenLayoutItem[][] = [];
        let currentPage: TokenLayoutItem[] = [];
        let currentX = this.options.xOffset;
        let currentY = this.options.yOffset;
        let rowHeight = 0;

        for (const token of tokens) {
            // Use the original diameter instead of scaled canvas dimensions
            const tokenSize = token.diameter;

            // Check if token fits on current row
            if (currentX + tokenSize > this.usableWidth) {
                // Move to next row
                currentX = this.options.xOffset;
                currentY += rowHeight + this.options.tokenPadding;
                rowHeight = 0;
            }

            // Check if token fits on current page
            if (currentY + tokenSize > this.usableHeight) {
                // Save current page and start new one
                pages.push(currentPage);
                currentPage = [];
                currentX = this.options.xOffset;
                currentY = this.options.yOffset;
                rowHeight = 0;
            }

            // Add token to current position
            currentPage.push({
                token,
                x: currentX,
                y: currentY,
                width: tokenSize,
                height: tokenSize
            });

            // Update position
            rowHeight = Math.max(rowHeight, tokenSize);
            currentX += tokenSize + this.options.tokenPadding;
        }

        // Add last page if not empty
        if (currentPage.length > 0) {
            pages.push(currentPage);
        }

        return pages;
    }

    /**
     * Generate PDF from tokens
     * @param tokens - Array of token objects with canvas
     * @param progressCallback - Progress callback (page, totalPages)
     * @param separatePages - Whether to separate character and reminder tokens onto different pages (default: true)
     * @returns Generated PDF document
     */
    async generatePDF(tokens: Token[], progressCallback: ProgressCallback | null = null, separatePages: boolean = true): Promise<jsPDFDocument> {
        const jspdfLib = window.jspdf;
        if (!jspdfLib) {
            throw new Error('jsPDF library not loaded');
        }

        // Create PDF document (dimensions in inches)
        const pdf = new jspdfLib.jsPDF({
            orientation: 'portrait',
            unit: 'in',
            format: [this.options.pageWidth, this.options.pageHeight]
        });

        // Calculate layout
        const pages = this.calculateGridLayout(tokens, separatePages);

        if (pages.length === 0) {
            return pdf;
        }

        // Generate each page
        for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
            const page = pages[pageIndex];

            if (pageIndex > 0) {
                pdf.addPage();
            }

            if (progressCallback) {
                progressCallback(pageIndex + 1, pages.length);
            }

            // Add tokens to page
            for (const item of page) {
                // Convert canvas to base64 image
                const dataUrl = item.token.canvas.toDataURL('image/png');

                // Calculate position in inches (from pixels at 300 DPI)
                const xInches = (this.marginPx + item.x) / this.options.dpi;
                const yInches = (this.marginPx + item.y) / this.options.dpi;
                const widthInches = item.width / this.options.dpi;
                const heightInches = item.height / this.options.dpi;

                // Add image to PDF
                pdf.addImage(
                    dataUrl,
                    'PNG',
                    xInches,
                    yInches,
                    widthInches,
                    heightInches
                );
            }
        }

        return pdf;
    }

    /**
     * Generate and download PDF
     * @param tokens - Array of token objects with canvas
     * @param filename - Output filename
     * @param progressCallback - Progress callback
     * @param separatePages - Whether to separate character and reminder tokens onto different pages (default: true)
     */
    async downloadPDF(
        tokens: Token[],
        filename: string = 'tokens.pdf',
        progressCallback: ProgressCallback | null = null,
        separatePages: boolean = true
    ): Promise<void> {
        const pdf = await this.generatePDF(tokens, progressCallback, separatePages);
        pdf.save(filename);
    }

    /**
     * Generate and return PDF as blob
     * @param tokens - Array of token objects with canvas
     * @param progressCallback - Progress callback
     * @param separatePages - Whether to separate character and reminder tokens onto different pages (default: true)
     * @returns PDF blob
     */
    async getPDFBlob(tokens: Token[], progressCallback: ProgressCallback | null = null, separatePages: boolean = true): Promise<Blob> {
        const pdf = await this.generatePDF(tokens, progressCallback, separatePages);
        return pdf.output('blob');
    }
}

/**
 * Create a ZIP file with all token images
 * @param tokens - Array of token objects with canvas
 * @param progressCallback - Progress callback
 * @param zipSettings - ZIP folder structure settings
 * @param scriptJson - Optional script JSON to include
 * @param pngSettings - Optional PNG export settings (for metadata embedding)
 * @returns ZIP file blob
 */
export async function createTokensZip(
    tokens: Token[],
    progressCallback: ProgressCallback | null = null,
    zipSettings: ZipExportOptions = {
        saveInTeamFolders: true,
        saveRemindersSeparately: true,
        metaTokenFolder: true,
        includeScriptJson: false,
        compressionLevel: 'normal'
    },
    scriptJson?: string,
    pngSettings?: PngExportOptions
): Promise<Blob> {
    // Validate input
    if (!tokens || !Array.isArray(tokens)) {
        throw new Error('Invalid tokens parameter: expected an array');
    }

    if (tokens.length === 0) {
        throw new Error('No tokens to export');
    }

    const JSZipConstructor = window.JSZip;
    if (!JSZipConstructor) {
        throw new Error('JSZip library not loaded');
    }

    const zip: JSZipInstance = new JSZipConstructor();
    const { 
        saveInTeamFolders, 
        saveRemindersSeparately, 
        metaTokenFolder = true,
        includeScriptJson = false,
        compressionLevel = 'normal'
    } = zipSettings;

    // Map compression level to JSZip compression options
    const compressionOptions: Record<string, number> = {
        'fast': 1,
        'normal': 6,
        'maximum': 9
    };
    const compressionValue = compressionOptions[compressionLevel] ?? 6;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (progressCallback) {
            progressCallback(i + 1, tokens.length);
        }

        // Convert canvas to blob
        let blob = await canvasToBlob(token.canvas);

        // Embed metadata if enabled
        if (pngSettings?.embedMetadata) {
            const metadata: PngMetadata = {
                Title: token.name,
                Description: `${token.type} token${token.team ? ` - ${token.team}` : ''}`,
                Source: 'Clocktower Token Generator',
            };
            
            // Add extra info in comment
            if (token.reminderText) {
                metadata.Comment = JSON.stringify({
                    type: token.type,
                    team: token.team,
                    reminderText: token.reminderText,
                    parentCharacter: token.parentCharacter,
                });
            } else {
                metadata.Comment = JSON.stringify({
                    type: token.type,
                    team: token.team,
                });
            }
            
            blob = await embedPngMetadata(blob, metadata);
        }

        // Add underscore prefix to meta tokens if not present
        let filename = token.filename;
        if (token.type === 'script-name' || token.type === 'almanac' || token.type === 'pandemonium') {
            if (!filename.startsWith('_')) {
                filename = `_${filename}`;
            }
        }
        filename = `${filename}.png`;

        // Determine folder path
        let folderPath = '';
        const isMetaToken = token.type === 'script-name' || token.type === 'almanac' || token.type === 'pandemonium';

        // Meta tokens go to _meta folder if enabled
        if (isMetaToken && metaTokenFolder) {
            folderPath = '_meta/';
        } else if (saveRemindersSeparately) {
            // Step 1: Separate by token type if enabled
            if (token.type === 'character' || isMetaToken) {
                folderPath = 'character_tokens/';
            } else {
                folderPath = 'reminder_tokens/';
            }
        }

        // Step 2: Add team subfolder if enabled (except meta tokens)
        if (saveInTeamFolders && !isMetaToken) {
            const teamName = TEAM_LABELS[token.team as keyof typeof TEAM_LABELS] ?? token.team;
            folderPath += `${teamName}/`;
        }

        // Create file at path (JSZip creates folders automatically)
        zip.file(folderPath + filename, blob);
    }

    // Include script JSON if enabled
    if (includeScriptJson && scriptJson) {
        const metaFolder = metaTokenFolder ? '_meta/' : '';
        zip.file(`${metaFolder}script.json`, scriptJson);
    }

    // Generate ZIP with compression settings
    return await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
            level: compressionValue
        }
    });
}

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
        const metadata: PngMetadata = {
            Title: token.name,
            Description: `${token.type} token${token.team ? ` - ${token.team}` : ''}`,
            Source: 'Clocktower Token Generator',
        };
        
        // Add reminder text if present
        if (token.reminderText) {
            metadata.Comment = JSON.stringify({
                type: token.type,
                team: token.team,
                reminderText: token.reminderText,
                parentCharacter: token.parentCharacter,
            });
        } else {
            metadata.Comment = JSON.stringify({
                type: token.type,
                team: token.team,
            });
        }
        
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

export default {
    PDFGenerator,
    createTokensZip,
    downloadTokenPNG
};
