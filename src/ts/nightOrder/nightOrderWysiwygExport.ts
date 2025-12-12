/**
 * Night Order WYSIWYG PDF Export
 *
 * Exports night order sheets to PDF using html2canvas + jsPDF for true WYSIWYG output.
 * This captures the DOM exactly as rendered, preserving custom fonts and icons.
 *
 * Note: Text is captured as images, so the PDF is not searchable.
 */

import html2canvas from 'html2canvas'
import type { DPIOption } from '../types/index.js'

/**
 * WYSIWYG Export Options
 */
export interface WysiwygExportOptions {
    /** DPI setting (300 or 600) - determines render quality */
    dpi: DPIOption
    /** PNG quality (use PNG for lossless, better for text) */
    usePng: boolean
}

const DEFAULT_OPTIONS: WysiwygExportOptions = {
    dpi: 300,
    usePng: true, // PNG for crisp text
}

/**
 * Calculate scale factor from DPI
 * Browser renders at 96dpi base, so scale = targetDpi / 96
 */
function dpiToScale(dpi: DPIOption): number {
    return dpi / 96
}

/**
 * Wait for all images in element to load
 */
async function ensureImagesLoaded(element: HTMLElement): Promise<void> {
    const images = element.querySelectorAll('img')
    await Promise.all(
        Array.from(images).map(img =>
            img.complete
                ? Promise.resolve()
                : new Promise<void>(resolve => {
                      img.onload = () => resolve()
                      img.onerror = () => resolve() // Continue even if image fails
                  })
        )
    )
}

/**
 * Capture a single element to canvas using html2canvas
 */
async function captureElement(
    element: HTMLElement,
    opts: WysiwygExportOptions
): Promise<HTMLCanvasElement> {
    await ensureImagesLoaded(element)

    const scale = dpiToScale(opts.dpi)

    return html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null, // Use element's own background
        logging: false,
        onclone: (_doc: Document, clonedElement: HTMLElement) => {
            // Hide drag handles and interactive elements in the clone
            clonedElement.querySelectorAll('[class*="dragHandle"]').forEach(el => {
                ;(el as HTMLElement).style.display = 'none'
            })
            clonedElement.querySelectorAll('[class*="dragArea"]').forEach(el => {
                ;(el as HTMLElement).style.display = 'none'
            })
            clonedElement.querySelectorAll('[class*="scalingWarning"]').forEach(el => {
                ;(el as HTMLElement).style.display = 'none'
            })
            clonedElement.querySelectorAll('[class*="lockIcon"]').forEach(el => {
                ;(el as HTMLElement).style.display = 'none'
            })
        },
    })
}

/**
 * Export night order sheets to PDF using WYSIWYG capture
 *
 * Captures both First Night and Other Nights pages exactly as they appear
 * in the preview, preserving custom fonts (Dumbledor, Goudy, TradeGothic),
 * character icons, and all styling.
 *
 * @param firstNightElement - The First Night page DOM element
 * @param otherNightElement - The Other Nights page DOM element
 * @param filename - Output filename (default: 'night-order.pdf')
 * @param options - Export options (dpi, format)
 */
export async function exportNightOrderPDF(
    firstNightElement: HTMLElement | null,
    otherNightElement: HTMLElement | null,
    filename: string = 'night-order.pdf',
    options: Partial<WysiwygExportOptions> = {}
): Promise<void> {
    const opts = { ...DEFAULT_OPTIONS, ...options }

    // Ensure at least one element exists
    if (!firstNightElement && !otherNightElement) {
        throw new Error('No night order sheets to export')
    }

    // Get jsPDF from window (loaded via CDN)
    const jspdfLib = (window as any).jspdf
    if (!jspdfLib) {
        throw new Error('jsPDF library not loaded. Please ensure jsPDF is available.')
    }

    // Page dimensions in inches
    const PAGE_WIDTH = 8.5
    const PAGE_HEIGHT = 11

    // Create PDF document
    const pdf = new jspdfLib.jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [PAGE_WIDTH, PAGE_HEIGHT],
        compress: true,
    })

    let pageAdded = false

    // Image format based on options
    const imageFormat = opts.usePng ? 'PNG' : 'JPEG'
    const mimeType = opts.usePng ? 'image/png' : 'image/jpeg'

    // Capture and add First Night page
    if (firstNightElement) {
        const canvas = await captureElement(firstNightElement, opts)

        // Calculate dimensions to fill page exactly while maintaining aspect ratio
        const canvasAspect = canvas.width / canvas.height
        const pageAspect = PAGE_WIDTH / PAGE_HEIGHT

        let imgWidth = PAGE_WIDTH
        let imgHeight = PAGE_HEIGHT
        let offsetX = 0
        let offsetY = 0

        if (canvasAspect > pageAspect) {
            // Canvas is wider - fit to width, may have vertical space
            imgHeight = PAGE_WIDTH / canvasAspect
            offsetY = (PAGE_HEIGHT - imgHeight) / 2
        } else if (canvasAspect < pageAspect) {
            // Canvas is taller - fit to height, may have horizontal space
            imgWidth = PAGE_HEIGHT * canvasAspect
            offsetX = (PAGE_WIDTH - imgWidth) / 2
        }

        const imgData = opts.usePng ? canvas.toDataURL(mimeType) : canvas.toDataURL(mimeType, 0.95)
        pdf.addImage(imgData, imageFormat, offsetX, offsetY, imgWidth, imgHeight)
        pageAdded = true
    }

    // Capture and add Other Nights page
    if (otherNightElement) {
        if (pageAdded) {
            pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'portrait')
        }
        const canvas = await captureElement(otherNightElement, opts)

        // Calculate dimensions to fill page exactly while maintaining aspect ratio
        const canvasAspect = canvas.width / canvas.height
        const pageAspect = PAGE_WIDTH / PAGE_HEIGHT

        let imgWidth = PAGE_WIDTH
        let imgHeight = PAGE_HEIGHT
        let offsetX = 0
        let offsetY = 0

        if (canvasAspect > pageAspect) {
            imgHeight = PAGE_WIDTH / canvasAspect
            offsetY = (PAGE_HEIGHT - imgHeight) / 2
        } else if (canvasAspect < pageAspect) {
            imgWidth = PAGE_HEIGHT * canvasAspect
            offsetX = (PAGE_WIDTH - imgWidth) / 2
        }

        const imgData = opts.usePng ? canvas.toDataURL(mimeType) : canvas.toDataURL(mimeType, 0.95)
        pdf.addImage(imgData, imageFormat, offsetX, offsetY, imgWidth, imgHeight)
    }

    // Save the PDF
    pdf.save(filename)
}
