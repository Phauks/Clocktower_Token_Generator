/**
 * Blood on the Clocktower Token Generator
 * Token Generator - Canvas operations for token generation
 */

import CONFIG from '../config.js';
import {
    CHARACTER_LAYOUT,
    REMINDER_LAYOUT,
    META_TOKEN_LAYOUT,
    QR_TOKEN_LAYOUT,
    LINE_HEIGHTS,
    TOKEN_COUNT_BADGE,
    DEFAULT_COLORS,
    QR_COLORS
} from '../constants.js';
import { loadImage, loadLocalImage, globalImageCache } from '../utils/index.js';
import { drawImageCover, createCircularClipPath, createCanvas, type Point, type CanvasContext } from '../canvas/index.js';
import {
    drawCurvedText,
    drawCenteredWrappedText,
    drawTwoLineCenteredText,
    drawAbilityText,
    drawQROverlayText
} from '../canvas/index.js';
import { drawLeaves, type LeafDrawingOptions } from '../canvas/index.js';
import { generateQRCode } from '../canvas/index.js';
import { getCharacterImageUrl, countReminders } from '../data/index.js';
import type { Character } from '../types/index.js';
import {
    type TokenGeneratorOptions,
    type MetaTokenContentRenderer,
    DEFAULT_TOKEN_OPTIONS
} from '../types/tokenOptions.js';

// Re-export generateAllTokens for backward compatibility
export { generateAllTokens } from './batchGenerator.js';

// ============================================================================
// TOKEN GENERATOR CLASS
// ============================================================================

/**
 * TokenGenerator class handles all canvas operations for creating tokens
 */
export class TokenGenerator {
    private options: TokenGeneratorOptions;
    // Note: Using globalImageCache singleton instead of instance cache
    // for better cache utilization across regenerations

    constructor(options: Partial<TokenGeneratorOptions> = {}) {
        this.options = { ...DEFAULT_TOKEN_OPTIONS, ...options };
        if (options.fontSpacing) {
            this.options.fontSpacing = { ...DEFAULT_TOKEN_OPTIONS.fontSpacing, ...options.fontSpacing };
        }
        if (options.textShadow) {
            this.options.textShadow = { ...DEFAULT_TOKEN_OPTIONS.textShadow, ...options.textShadow };
        }
    }

    /** Update generator options */
    updateOptions(newOptions: Partial<TokenGeneratorOptions>): void {
        this.options = { ...this.options, ...newOptions };
    }

    // ========================================================================
    // IMAGE CACHING (using global singleton)
    // ========================================================================

    async getCachedImage(url: string): Promise<HTMLImageElement> {
        return globalImageCache.get(url, false);
    }

    async getLocalImage(path: string): Promise<HTMLImageElement> {
        return globalImageCache.get(path, true);
    }

    clearCache(): void {
        globalImageCache.clear();
    }

    // ========================================================================
    // CANVAS UTILITIES
    // ========================================================================

    private createBaseCanvas(diameter: number): CanvasContext {
        return createCanvas(diameter, { dpi: this.options.dpi });
    }

    private applyCircularClip(ctx: CanvasRenderingContext2D, center: Point, radius: number): void {
        ctx.save();
        createCircularClipPath(ctx, center, radius);
    }

    private async drawBackground(
        ctx: CanvasRenderingContext2D,
        backgroundName: string,
        diameter: number,
        fallbackColor: string = DEFAULT_COLORS.FALLBACK_BACKGROUND
    ): Promise<void> {
        try {
            const bgPath = `${CONFIG.ASSETS.CHARACTER_BACKGROUNDS}${backgroundName}.png`;
            const bgImage = await this.getLocalImage(bgPath);
            drawImageCover(ctx, bgImage, diameter, diameter);
        } catch {
            if (!this.options.transparentBackground) {
                ctx.fillStyle = fallbackColor;
                ctx.fill();
            }
        }
    }

    // ========================================================================
    // CHARACTER TOKEN GENERATION
    // ========================================================================

    async generateCharacterToken(character: Character): Promise<HTMLCanvasElement> {
        const diameter = CONFIG.TOKEN.ROLE_DIAMETER_INCHES * this.options.dpi;
        const { canvas, ctx, center, radius } = this.createBaseCanvas(diameter);

        this.applyCircularClip(ctx, center, radius);
        await this.drawBackground(ctx, this.options.characterBackground, diameter);
        await this.drawCharacterImage(ctx, character, diameter, CHARACTER_LAYOUT);

        if (character.setup) {
            await this.drawSetupFlower(ctx, diameter);
        }

        ctx.restore();

        if (this.options.maximumLeaves > 0) {
            await this.drawLeavesOnToken(ctx, diameter);
        }

        if (this.options.displayAbilityText && character.ability) {
            this.drawCharacterAbilityText(ctx, character.ability, diameter);
        }

        if (character.name) {
            this.drawCharacterName(ctx, character.name, center, radius, diameter);
        }

        if (this.options.tokenCount) {
            const reminderCount = countReminders(character);
            if (reminderCount > 0) {
                this.drawTokenCount(ctx, reminderCount, diameter);
            }
        }

        return canvas;
    }

    private async drawCharacterImage(
        ctx: CanvasRenderingContext2D,
        character: Character,
        diameter: number,
        layout: typeof CHARACTER_LAYOUT | typeof REMINDER_LAYOUT
    ): Promise<void> {
        const imageUrl = getCharacterImageUrl(character.image);
        if (!imageUrl) return;

        try {
            const charImage = await this.getCachedImage(imageUrl);
            const imgSize = diameter * layout.IMAGE_SIZE_RATIO;
            const imgOffset = (diameter - imgSize) / 2;
            ctx.drawImage(
                charImage,
                imgOffset,
                imgOffset - diameter * layout.IMAGE_VERTICAL_OFFSET,
                imgSize,
                imgSize
            );
        } catch (error) {
            console.warn(`Could not load character image for ${character.name}`, error);
        }
    }

    private async drawSetupFlower(ctx: CanvasRenderingContext2D, diameter: number): Promise<void> {
        try {
            const flowerPath = `${CONFIG.ASSETS.SETUP_FLOWERS}${this.options.setupFlowerStyle}.png`;
            const flowerImage = await this.getLocalImage(flowerPath);
            drawImageCover(ctx, flowerImage, diameter, diameter);
        } catch {
            console.warn('Could not load setup flower');
        }
    }

    private async drawLeavesOnToken(ctx: CanvasRenderingContext2D, diameter: number): Promise<void> {
        const leafOptions: LeafDrawingOptions = {
            maximumLeaves: this.options.maximumLeaves,
            leafPopulationProbability: this.options.leafPopulationProbability,
            leafGeneration: this.options.leafGeneration,
            leafArcSpan: this.options.leafArcSpan,
            leafSlots: this.options.leafSlots
        };
        await drawLeaves(ctx, diameter, leafOptions);
    }

    private drawCharacterAbilityText(ctx: CanvasRenderingContext2D, ability: string, diameter: number): void {
        drawAbilityText(
            ctx, ability, diameter,
            this.options.abilityTextFont,
            CONFIG.FONTS.ABILITY_TEXT.SIZE_RATIO,
            CONFIG.FONTS.ABILITY_TEXT.LINE_HEIGHT ?? LINE_HEIGHTS.STANDARD,
            CHARACTER_LAYOUT.ABILITY_TEXT_MAX_WIDTH,
            CHARACTER_LAYOUT.ABILITY_TEXT_Y_POSITION,
            this.options.abilityTextColor,
            this.options.fontSpacing.abilityText,
            this.options.textShadow?.abilityText ?? 3
        );
    }

    private drawCharacterName(
        ctx: CanvasRenderingContext2D,
        name: string,
        center: Point,
        radius: number,
        diameter: number
    ): void {
        drawCurvedText(ctx, {
            text: name.toUpperCase(),
            centerX: center.x,
            centerY: center.y,
            radius: radius * CHARACTER_LAYOUT.CURVED_TEXT_RADIUS,
            fontFamily: this.options.characterNameFont,
            fontSize: diameter * CONFIG.FONTS.CHARACTER_NAME.SIZE_RATIO,
            position: 'bottom',
            color: this.options.characterNameColor,
            letterSpacing: this.options.fontSpacing.characterName,
            shadowBlur: this.options.textShadow?.characterName ?? 4
        });
    }

    private drawTokenCount(ctx: CanvasRenderingContext2D, count: number, diameter: number): void {
        ctx.save();
        const fontSize = diameter * CONFIG.FONTS.TOKEN_COUNT.SIZE_RATIO;
        ctx.font = `bold ${fontSize}px "${this.options.characterNameFont}", Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const y = diameter * CHARACTER_LAYOUT.TOKEN_COUNT_Y_POSITION;

        ctx.beginPath();
        ctx.arc(diameter / 2, y, fontSize * TOKEN_COUNT_BADGE.BACKGROUND_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = DEFAULT_COLORS.BADGE_BACKGROUND;
        ctx.fill();
        ctx.strokeStyle = DEFAULT_COLORS.TEXT_PRIMARY;
        ctx.lineWidth = TOKEN_COUNT_BADGE.STROKE_WIDTH;
        ctx.stroke();

        ctx.fillStyle = DEFAULT_COLORS.TEXT_PRIMARY;
        ctx.fillText(count.toString(), diameter / 2, y);
        ctx.restore();
    }

    // ========================================================================
    // REMINDER TOKEN GENERATION
    // ========================================================================

    async generateReminderToken(character: Character, reminderText: string): Promise<HTMLCanvasElement> {
        const diameter = CONFIG.TOKEN.REMINDER_DIAMETER_INCHES * this.options.dpi;
        const { canvas, ctx, center, radius } = this.createBaseCanvas(diameter);

        this.applyCircularClip(ctx, center, radius);

        if (!this.options.transparentBackground) {
            ctx.fillStyle = this.options.reminderBackground;
            ctx.fill();
        }

        await this.drawCharacterImage(ctx, character, diameter, REMINDER_LAYOUT);
        ctx.restore();

        drawCurvedText(ctx, {
            text: reminderText.toUpperCase(),
            centerX: center.x,
            centerY: center.y,
            radius: radius * REMINDER_LAYOUT.CURVED_TEXT_RADIUS,
            fontFamily: this.options.characterReminderFont,
            fontSize: diameter * CONFIG.FONTS.REMINDER_TEXT.SIZE_RATIO,
            position: 'bottom',
            color: this.options.reminderTextColor,
            letterSpacing: this.options.fontSpacing.reminderText,
            shadowBlur: this.options.textShadow?.reminderText ?? 4
        });

        return canvas;
    }

    // ========================================================================
    // META TOKEN GENERATION
    // ========================================================================

    private async generateMetaToken(
        renderContent: MetaTokenContentRenderer,
        backgroundOverride?: string
    ): Promise<HTMLCanvasElement> {
        const diameter = CONFIG.TOKEN.ROLE_DIAMETER_INCHES * this.options.dpi;
        const { canvas, ctx, center, radius } = this.createBaseCanvas(diameter);

        this.applyCircularClip(ctx, center, radius);
        const bgName = backgroundOverride || this.options.metaBackground || this.options.characterBackground;
        await this.drawBackground(ctx, bgName, diameter);
        ctx.restore();

        await renderContent(ctx, diameter, center, radius);
        return canvas;
    }

    async generateScriptNameToken(scriptName: string, author?: string): Promise<HTMLCanvasElement> {
        return this.generateMetaToken((ctx, diameter, center, radius) => {
            drawCenteredWrappedText(ctx, {
                text: scriptName.toUpperCase(),
                diameter,
                fontFamily: this.options.characterNameFont,
                fontSizeRatio: META_TOKEN_LAYOUT.CENTERED_TEXT_SIZE,
                maxWidthRatio: META_TOKEN_LAYOUT.CENTERED_TEXT_MAX_WIDTH,
                color: DEFAULT_COLORS.TEXT_PRIMARY,
                shadowBlur: this.options.textShadow?.characterName ?? 4
            });

            if (author) {
                drawCurvedText(ctx, {
                    text: author,
                    centerX: center.x,
                    centerY: center.y,
                    radius: radius * CHARACTER_LAYOUT.CURVED_TEXT_RADIUS,
                    fontFamily: this.options.characterNameFont,
                    fontSize: diameter * CONFIG.FONTS.CHARACTER_NAME.SIZE_RATIO * META_TOKEN_LAYOUT.AUTHOR_TEXT_SIZE_FACTOR,
                    position: 'bottom',
                    color: DEFAULT_COLORS.TEXT_PRIMARY,
                    letterSpacing: this.options.fontSpacing.characterName,
                    shadowBlur: this.options.textShadow?.characterName ?? 4
                });
            }
        });
    }

    async generatePandemoniumToken(): Promise<HTMLCanvasElement> {
        return this.generateMetaToken((ctx, diameter, center, radius) => {
            drawTwoLineCenteredText(
                ctx, 'PANDEMONIUM', 'INSTITUTE', diameter,
                this.options.characterNameFont,
                META_TOKEN_LAYOUT.PANDEMONIUM_TEXT_SIZE,
                DEFAULT_COLORS.TEXT_PRIMARY,
                this.options.textShadow?.characterName ?? 4
            );

            drawCurvedText(ctx, {
                text: 'BLOOD ON THE CLOCKTOWER',
                centerX: center.x,
                centerY: center.y,
                radius: radius * CHARACTER_LAYOUT.CURVED_TEXT_RADIUS,
                fontFamily: this.options.characterNameFont,
                fontSize: diameter * CONFIG.FONTS.CHARACTER_NAME.SIZE_RATIO * META_TOKEN_LAYOUT.BOTC_TEXT_SIZE_FACTOR,
                position: 'bottom',
                color: DEFAULT_COLORS.TEXT_PRIMARY,
                letterSpacing: this.options.fontSpacing.characterName,
                shadowBlur: this.options.textShadow?.characterName ?? 4
            });
        });
    }

    async generateAlmanacQRToken(almanacUrl: string, scriptName: string): Promise<HTMLCanvasElement> {
        const diameter = CONFIG.TOKEN.ROLE_DIAMETER_INCHES * this.options.dpi;
        const { canvas, ctx, center, radius } = this.createBaseCanvas(diameter);

        this.applyCircularClip(ctx, center, radius);

        const bgName = this.options.metaBackground || this.options.characterBackground;
        await this.drawBackground(ctx, bgName, diameter, QR_COLORS.LIGHT);

        // Generate and draw QR code
        const qrSize = Math.floor(diameter * QR_TOKEN_LAYOUT.QR_CODE_SIZE);
        const qrCanvas = await generateQRCode({ text: almanacUrl, size: qrSize });
        const qrOffset = (diameter - qrSize) / 2;
        ctx.drawImage(qrCanvas, qrOffset, qrOffset - diameter * QR_TOKEN_LAYOUT.QR_VERTICAL_OFFSET, qrSize, qrSize);

        ctx.restore();

        // Draw white box behind script name
        const boxWidth = diameter * QR_TOKEN_LAYOUT.TEXT_BOX_WIDTH;
        const boxHeight = diameter * QR_TOKEN_LAYOUT.TEXT_BOX_HEIGHT;
        const boxX = (diameter - boxWidth) / 2;
        const boxY = (diameter - boxHeight) / 2 - diameter * QR_TOKEN_LAYOUT.QR_VERTICAL_OFFSET;
        ctx.fillStyle = QR_COLORS.LIGHT;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        drawQROverlayText(
            ctx, scriptName.toUpperCase(), diameter, 'LHF Unlovable',
            QR_TOKEN_LAYOUT.OVERLAY_TEXT_SIZE,
            QR_TOKEN_LAYOUT.OVERLAY_TEXT_MAX_WIDTH,
            QR_TOKEN_LAYOUT.QR_VERTICAL_OFFSET,
            QR_COLORS.DARK
        );

        drawCurvedText(ctx, {
            text: 'ALMANAC',
            centerX: center.x,
            centerY: center.y,
            radius: radius * CHARACTER_LAYOUT.CURVED_TEXT_RADIUS,
            fontFamily: this.options.characterNameFont,
            fontSize: diameter * CONFIG.FONTS.CHARACTER_NAME.SIZE_RATIO,
            position: 'bottom',
            color: QR_COLORS.DARK,
            letterSpacing: this.options.fontSpacing.characterName,
            shadowBlur: 0
        });

        return canvas;
    }
}

export default { TokenGenerator };
