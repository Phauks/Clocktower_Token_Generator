/**
 * Night Order Export
 *
 * Generates PDF export of night order sheets.
 * Uses jsPDF (loaded via CDN in index.html).
 */

import type { NightOrderEntry, NightOrderState } from './nightOrderTypes.js'
import type { ScriptMeta } from '../types/index.js'
import { parseAbilityText, getTeamColor } from './nightOrderUtils.js'
import { calculateScaleConfig } from './nightOrderLayout.js'

/**
 * Extended jsPDF document type for our needs
 * The base PDFDocument interface is minimal - we use any for full API access
 */
type PDFDocument = any

/**
 * Night Order PDF Export Options
 */
export interface NightOrderPDFOptions {
    /** Page width in inches */
    pageWidth: number
    /** Page height in inches */
    pageHeight: number
    /** Include First Night sheet */
    includeFirstNight: boolean
    /** Include Other Nights sheet */
    includeOtherNight: boolean
    /** Show script logo in header */
    showScriptLogo: boolean
    /** Image quality (0-1) */
    imageQuality: number
}

/**
 * Default export options
 */
const DEFAULT_OPTIONS: NightOrderPDFOptions = {
    pageWidth: 8.5,
    pageHeight: 11,
    includeFirstNight: true,
    includeOtherNight: true,
    showScriptLogo: true,
    imageQuality: 0.92,
}

/**
 * Font sizes (in points)
 */
const FONTS = {
    TITLE: 28,
    SCRIPT_NAME: 16,
    CHARACTER_NAME: 12,
    ABILITY_TEXT: 10,
    FOOTER: 8,
} as const

/**
 * Colors
 */
const COLORS = {
    PARCHMENT_BG: '#f4edd9',
    FIRST_NIGHT_TITLE: '#1a3a5a',
    OTHER_NIGHT_TITLE: '#4a2a6a',
    BORDER_GREEN: '#1a5a1a',
    TEXT_DARK: '#1a1a1a',
    TEXT_SECONDARY: '#5a5040',
    TOWNSFOLK: '#1a5f2a',
    OUTSIDER: '#1a3f5f',
    MINION: '#5f1a3f',
    DEMON: '#8b0000',
    TRAVELLER: '#5f4f1a',
    FABLED: '#4f1a5f',
    SPECIAL: '#4a4a4a',
} as const

/**
 * Get color for team
 */
function getTeamColorPDF(team?: string): string {
    switch (team) {
        case 'townsfolk': return COLORS.TOWNSFOLK
        case 'outsider': return COLORS.OUTSIDER
        case 'minion': return COLORS.MINION
        case 'demon': return COLORS.DEMON
        case 'traveller': return COLORS.TRAVELLER
        case 'fabled': return COLORS.FABLED
        case 'special': return COLORS.SPECIAL
        default: return COLORS.TEXT_DARK
    }
}

/**
 * Night Order PDF Exporter
 */
export class NightOrderPDFExporter {
    private options: NightOrderPDFOptions

    constructor(options: Partial<NightOrderPDFOptions> = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options }
    }

    /**
     * Generate PDF from night order data
     */
    async generatePDF(
        firstNight: NightOrderState,
        otherNight: NightOrderState,
        scriptMeta: ScriptMeta | null
    ): Promise<PDFDocument> {
        const jspdfLib = (window as any).jspdf
        if (!jspdfLib) {
            throw new Error('jsPDF library not loaded. Please ensure jsPDF is available.')
        }

        const pdf = new jspdfLib.jsPDF({
            orientation: 'portrait',
            unit: 'in',
            format: [this.options.pageWidth, this.options.pageHeight],
            compress: true,
        }) as PDFDocument

        let pageAdded = false

        // Generate First Night page
        if (this.options.includeFirstNight && firstNight.entries.length > 0) {
            this.renderNightSheet(pdf, 'first', firstNight.entries, scriptMeta)
            pageAdded = true
        }

        // Generate Other Nights page
        if (this.options.includeOtherNight && otherNight.entries.length > 0) {
            if (pageAdded) {
                pdf.addPage()
            }
            this.renderNightSheet(pdf, 'other', otherNight.entries, scriptMeta)
        }

        return pdf
    }

    /**
     * Render a single night sheet page
     */
    private renderNightSheet(
        pdf: PDFDocument,
        type: 'first' | 'other',
        entries: NightOrderEntry[],
        scriptMeta: ScriptMeta | null
    ): void {
        const margin = 0.5 // inches
        const pageWidth = this.options.pageWidth
        const pageHeight = this.options.pageHeight
        const contentWidth = pageWidth - (margin * 2)

        // Calculate dynamic scaling to fit all entries on one page
        const scaleConfig = calculateScaleConfig(entries)

        // Draw parchment background
        this.drawParchmentBackground(pdf)

        // Draw header with scaled fonts
        let yPos = margin + 0.2
        yPos = this.drawHeader(pdf, type, scriptMeta, margin, yPos, contentWidth, scaleConfig)

        // Draw entries with scaled dimensions
        yPos = this.drawEntries(pdf, entries, margin, yPos, contentWidth, pageHeight - margin - 0.8, scaleConfig)

        // Draw footer
        this.drawFooter(pdf, margin, pageHeight - margin - 0.3, contentWidth)

        // Draw decorative border
        this.drawDecorativeBorder(pdf, pageHeight)
    }

    /**
     * Draw parchment-like background
     */
    private drawParchmentBackground(pdf: PDFDocument): void {
        // Fill with parchment color
        pdf.setFillColor(244, 237, 217) // #f4edd9
        pdf.rect(0, 0, this.options.pageWidth, this.options.pageHeight, 'F')
    }

    /**
     * Draw header with title and script name (with dynamic scaling)
     */
    private drawHeader(
        pdf: PDFDocument,
        type: 'first' | 'other',
        scriptMeta: ScriptMeta | null,
        margin: number,
        yPos: number,
        contentWidth: number,
        scaleConfig: any
    ): number {
        const title = type === 'first' ? 'First Night' : 'Other Nights'
        const titleColor = type === 'first' ? COLORS.FIRST_NIGHT_TITLE : COLORS.OTHER_NIGHT_TITLE

        // Convert rem to points: 1 rem = 12pt baseline, scaled by header font size
        const scaledTitleSize = scaleConfig.headerFontSize * 12 * 1.2 // Adjust for PDF rendering

        // Title on left (use Helvetica Bold as Dumbledor won't be available in PDF)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(scaledTitleSize)
        pdf.setTextColor(...this.hexToRgb(titleColor))
        pdf.text(title, margin, yPos)

        // Script name on right (slightly smaller than title)
        if (scriptMeta?.name && this.options.showScriptLogo) {
            pdf.setFont('helvetica', 'italic')
            pdf.setFontSize(scaledTitleSize * 0.6)
            pdf.setTextColor(...this.hexToRgb('#2a5a2a'))
            const textWidth = pdf.getTextWidth(scriptMeta.name)
            pdf.text(scriptMeta.name, margin + contentWidth - textWidth, yPos)
        }

        // Divider line (scaled spacing)
        yPos += 0.15 * scaleConfig.scaleFactor
        pdf.setDrawColor(...this.hexToRgb(titleColor))
        pdf.setLineWidth(0.02)
        pdf.line(margin, yPos, margin + contentWidth, yPos)

        return yPos + (0.3 * scaleConfig.scaleFactor)
    }

    /**
     * Draw night order entries (with dynamic scaling)
     */
    private drawEntries(
        pdf: PDFDocument,
        entries: NightOrderEntry[],
        margin: number,
        startY: number,
        contentWidth: number,
        maxY: number,
        scaleConfig: any
    ): number {
        let yPos = startY
        const iconSize = scaleConfig.iconSize // Use scaled icon size
        const textStartX = margin + iconSize + (0.15 * scaleConfig.scaleFactor)

        for (const entry of entries) {
            // NO OVERFLOW CHECK - scaling ensures all entries fit
            // (Removed: if (yPos + entryHeight > maxY) break)

            // Draw character name with scaled font
            const teamColor = getTeamColorPDF(entry.team)
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(scaleConfig.nameFontSize) // Use scaled name font
            pdf.setTextColor(...this.hexToRgb(teamColor))
            pdf.text(entry.name, textStartX, yPos)

            // Draw ability text with scaled font
            yPos += (0.18 * scaleConfig.scaleFactor) // Scaled spacing
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(scaleConfig.abilityFontSize) // Use scaled ability font
            pdf.setTextColor(...this.hexToRgb(COLORS.TEXT_DARK))

            // Parse and render ability text with bold tokens and circle indicators
            const segments = parseAbilityText(entry.ability)
            let xPos = textStartX
            const maxTextWidth = contentWidth - iconSize - (0.3 * scaleConfig.scaleFactor)

            for (const segment of segments) {
                if (segment.isCircle) {
                    // Draw grey circle indicator
                    const circleRadius = scaleConfig.abilityFontSize * 0.3

                    // Check if circle fits on current line
                    if (xPos + (circleRadius * 2) - textStartX > maxTextWidth) {
                        yPos += (0.14 * scaleConfig.scaleFactor)
                        xPos = textStartX
                    }

                    // Draw filled circle
                    pdf.setFillColor(136, 136, 136) // #888888 grey
                    pdf.circle(xPos + circleRadius, yPos - circleRadius, circleRadius, 'F')
                    xPos += (circleRadius * 2) + (scaleConfig.abilityFontSize * 0.2) // spacing

                } else {
                    // Text segment (bold or normal)
                    if (segment.isBold) {
                        pdf.setFont('helvetica', 'bold')
                    } else {
                        pdf.setFont('helvetica', 'normal')
                    }

                    // Simple text wrapping - split if too long
                    const text = segment.text
                    const textWidth = pdf.getTextWidth(text)

                    if (xPos + textWidth - textStartX > maxTextWidth) {
                        // Need to wrap
                        const words = text.split(' ')
                        for (const word of words) {
                            const wordWidth = pdf.getTextWidth(word + ' ')
                            if (xPos + wordWidth - textStartX > maxTextWidth) {
                                yPos += (0.14 * scaleConfig.scaleFactor) // Scaled line height
                                xPos = textStartX
                            }
                            pdf.text(word + ' ', xPos, yPos)
                            xPos += wordWidth
                        }
                    } else {
                        pdf.text(text, xPos, yPos)
                        xPos += textWidth
                    }
                }
            }

            // Draw separator line
            yPos += (0.12 * scaleConfig.scaleFactor) // Scaled spacing
            pdf.setDrawColor(200, 195, 180)
            pdf.setLineWidth(0.005)
            pdf.line(margin, yPos, margin + contentWidth, yPos)

            yPos += scaleConfig.entrySpacing // Use scaled entry spacing
        }

        return yPos
    }

    /**
     * Draw footer
     */
    private drawFooter(
        pdf: PDFDocument,
        margin: number,
        yPos: number,
        contentWidth: number
    ): void {
        pdf.setFont('helvetica', 'italic')
        pdf.setFontSize(FONTS.FOOTER)
        pdf.setTextColor(...this.hexToRgb(COLORS.TEXT_SECONDARY))

        const copyright = '© Steven Medway bloodontheclocktower.com'
        const template = 'Script template by John Forster ravenswoodstudio.xyz'

        const copyrightWidth = pdf.getTextWidth(copyright)
        const templateWidth = pdf.getTextWidth(template)

        pdf.text(copyright, margin + contentWidth - copyrightWidth, yPos)
        pdf.text(template, margin + contentWidth - templateWidth, yPos + 0.12)
    }

    /**
     * Draw decorative green border at bottom
     */
    private drawDecorativeBorder(pdf: PDFDocument, pageHeight: number): void {
        const borderHeight = 0.4
        const yPos = pageHeight - borderHeight

        // Gradient-like effect with multiple rectangles
        const steps = 5
        const stepHeight = borderHeight / steps

        for (let i = 0; i < steps; i++) {
            const alpha = 1 - (i / steps)
            const r = Math.round(20 + (50 - 20) * (1 - alpha))
            const g = Math.round(61 + (138 - 61) * (1 - alpha))
            const b = Math.round(20 + (50 - 20) * (1 - alpha))

            pdf.setFillColor(r, g, b)
            pdf.rect(0, yPos + (i * stepHeight), this.options.pageWidth, stepHeight, 'F')
        }
    }

    /**
     * Convert hex color to RGB array
     */
    private hexToRgb(hex: string): [number, number, number] {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        if (result) {
            return [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16),
            ]
        }
        return [0, 0, 0]
    }

    /**
     * Download PDF
     */
    async downloadPDF(
        firstNight: NightOrderState,
        otherNight: NightOrderState,
        scriptMeta: ScriptMeta | null,
        filename: string = 'night-order.pdf'
    ): Promise<void> {
        const pdf = await this.generatePDF(firstNight, otherNight, scriptMeta)
        pdf.save(filename)
    }

    /**
     * Get PDF as blob
     */
    async getPDFBlob(
        firstNight: NightOrderState,
        otherNight: NightOrderState,
        scriptMeta: ScriptMeta | null
    ): Promise<Blob> {
        const pdf = await this.generatePDF(firstNight, otherNight, scriptMeta)
        return pdf.output('blob')
    }
}

/**
 * Export convenience function
 */
export async function exportNightOrderPDF(
    firstNight: NightOrderState,
    otherNight: NightOrderState,
    scriptMeta: ScriptMeta | null,
    filename?: string,
    options?: Partial<NightOrderPDFOptions>
): Promise<void> {
    const exporter = new NightOrderPDFExporter(options)
    await exporter.downloadPDF(firstNight, otherNight, scriptMeta, filename)
}
