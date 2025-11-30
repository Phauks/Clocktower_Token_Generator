import { useState, useCallback } from 'react'
import { useTokenContext } from '../contexts/TokenContext'
import { PDFGenerator, createTokensZip } from '../ts/pdfGenerator.js'
import type { ProgressCallback } from '../ts/types/index.js'

// Helper to sanitize filename
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\- ]/gi, '_')
}

// Helper to download a blob
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function useExport() {
  const { tokens, generationOptions, scriptMeta, jsonInput } = useTokenContext()
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null)

  const getBaseFilename = useCallback(() => {
    if (scriptMeta?.name) {
      return sanitizeFilename(scriptMeta.name)
    }
    return 'clocktower_tokens'
  }, [scriptMeta])

  const downloadZip = useCallback(async () => {
    if (tokens.length === 0) return

    try {
      setIsExporting(true)
      setExportProgress({ current: 0, total: tokens.length })

      const progressCallback: ProgressCallback = (current, total) => {
        setExportProgress({ current, total })
      }

      const zipSettings = {
        saveInTeamFolders: generationOptions.zipSettings?.saveInTeamFolders ?? true,
        saveRemindersSeparately: generationOptions.zipSettings?.saveRemindersSeparately ?? true,
        metaTokenFolder: generationOptions.zipSettings?.metaTokenFolder ?? true,
        includeScriptJson: generationOptions.zipSettings?.includeScriptJson ?? false,
        compressionLevel: generationOptions.zipSettings?.compressionLevel ?? 'normal' as const,
      }

      const blob = await createTokensZip(
        tokens,
        progressCallback,
        zipSettings,
        zipSettings.includeScriptJson ? jsonInput : undefined,
        generationOptions.pngSettings
      )

      const filename = `${getBaseFilename()}.zip`
      downloadFile(blob, filename)
    } catch (error) {
      console.error('ZIP creation error:', error)
      throw error
    } finally {
      setIsExporting(false)
      setExportProgress(null)
    }
  }, [tokens, generationOptions, jsonInput, getBaseFilename])

  const downloadPdf = useCallback(async () => {
    if (tokens.length === 0) return

    try {
      setIsExporting(true)
      setExportProgress({ current: 0, total: 1 })

      const pdfGenerator = new PDFGenerator({
        tokenPadding: generationOptions.pdfPadding ?? 75,
        xOffset: generationOptions.pdfXOffset ?? 0,
        yOffset: generationOptions.pdfYOffset ?? 0,
      })

      const progressCallback: ProgressCallback = (current, total) => {
        setExportProgress({ current, total })
      }

      const filename = `${getBaseFilename()}.pdf`
      await pdfGenerator.downloadPDF(tokens, filename, progressCallback)
    } catch (error) {
      console.error('PDF generation error:', error)
      throw error
    } finally {
      setIsExporting(false)
      setExportProgress(null)
    }
  }, [tokens, generationOptions, getBaseFilename])

  const downloadJson = useCallback(() => {
    if (!jsonInput) return

    const blob = new Blob([jsonInput], { type: 'application/json' })
    const filename = `${getBaseFilename()}.json`
    downloadFile(blob, filename)
  }, [jsonInput, getBaseFilename])

  const downloadStyleFormat = useCallback(() => {
    // Export generation options as a style preset JSON
    const styleData = {
      version: '1.0',
      name: scriptMeta?.name ? `${scriptMeta.name} Style` : 'Custom Style',
      generationOptions: generationOptions,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(styleData, null, 2)], { type: 'application/json' })
    const filename = `${getBaseFilename()}_style.json`
    downloadFile(blob, filename)
  }, [generationOptions, scriptMeta, getBaseFilename])

  const downloadAll = useCallback(async () => {
    if (tokens.length === 0) return

    try {
      setIsExporting(true)
      
      // Download ZIP (includes tokens)
      await downloadZip()
      
      // Download PDF
      await downloadPdf()
      
      // Download JSON
      downloadJson()
      
      // Download Style
      downloadStyleFormat()
    } catch (error) {
      console.error('Download All error:', error)
      throw error
    } finally {
      setIsExporting(false)
      setExportProgress(null)
    }
  }, [tokens, downloadZip, downloadPdf, downloadJson, downloadStyleFormat])

  return {
    downloadZip,
    downloadPdf,
    downloadJson,
    downloadStyleFormat,
    downloadAll,
    isExporting,
    exportProgress,
    getBaseFilename,
  }
}
