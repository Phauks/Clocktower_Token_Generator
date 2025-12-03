import { useState, useCallback, useRef } from 'react'
import { useTokenContext } from '../contexts/TokenContext'
import { PDFGenerator } from '../ts/export/pdfGenerator.js'
import { createTokensZip, getTokenFilename, getTokenFolderPath, processTokenToBlob } from '../ts/export/zipExporter.js'
import { sanitizeFilename } from '../ts/utils/index.js'
import type { ProgressCallback, JSZipInstance, ZipExportOptions } from '../ts/types/index.js'

// Extend Window interface for JSZip
declare global {
  interface Window {
    JSZip: new () => JSZipInstance
  }
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

export type ExportStep = 'zip' | 'pdf' | 'json' | 'style' | null

export function useExport() {
  const { tokens, generationOptions, scriptMeta, jsonInput } = useTokenContext()
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null)
  const [exportStep, setExportStep] = useState<ExportStep>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  // Track if we're in a downloadAll operation to avoid resetting state
  const isDownloadingAllRef = useRef(false)

  const getBaseFilename = useCallback(() => {
    if (scriptMeta?.name) {
      return sanitizeFilename(scriptMeta.name)
    }
    return 'clocktower_tokens'
  }, [scriptMeta])

  // Cancel any in-progress export
  const cancelExport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    isDownloadingAllRef.current = false
    setIsExporting(false)
    setExportProgress(null)
    setExportStep(null)
  }, [])

  const downloadZip = useCallback(async () => {
    if (tokens.length === 0) return

    const isPartOfDownloadAll = isDownloadingAllRef.current

    // Only cancel/reset if this is a standalone call
    if (!isPartOfDownloadAll) {
      cancelExport()
      abortControllerRef.current = new AbortController()
      setIsExporting(true)
    }
    
    setExportProgress({ current: 0, total: tokens.length })

    try {
      const progressCallback: ProgressCallback = (current, total) => {
        if (abortControllerRef.current?.signal.aborted) {
          throw new DOMException('Export cancelled', 'AbortError')
        }
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

      // Check if cancelled before downloading
      if (abortControllerRef.current?.signal.aborted) {
        throw new DOMException('Export cancelled', 'AbortError')
      }

      const filename = `${getBaseFilename()}.zip`
      downloadFile(blob, filename)
    } catch (error) {
      // Don't log abort errors as they're intentional
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('ZIP export cancelled')
        return
      }
      console.error('ZIP creation error:', error)
      throw error
    } finally {
      // Only reset state if this is a standalone call
      if (!isPartOfDownloadAll) {
        setIsExporting(false)
        setExportProgress(null)
        abortControllerRef.current = null
      }
    }
  }, [tokens, generationOptions, jsonInput, getBaseFilename, cancelExport])

  const downloadPdf = useCallback(async () => {
    if (tokens.length === 0) return

    const isPartOfDownloadAll = isDownloadingAllRef.current

    // Only cancel/reset if this is a standalone call
    if (!isPartOfDownloadAll) {
      cancelExport()
      abortControllerRef.current = new AbortController()
      setIsExporting(true)
    }
    
    setExportProgress({ current: 0, total: tokens.length })

    try {
      const pdfGenerator = new PDFGenerator({
        tokenPadding: generationOptions.pdfPadding ?? 75,
        xOffset: generationOptions.pdfXOffset ?? 0,
        yOffset: generationOptions.pdfYOffset ?? 0,
      })

      const progressCallback: ProgressCallback = (current, total) => {
        if (abortControllerRef.current?.signal.aborted) {
          throw new DOMException('Export cancelled', 'AbortError')
        }
        setExportProgress({ current, total })
      }

      const filename = `${getBaseFilename()}.pdf`
      await pdfGenerator.downloadPDF(tokens, filename, progressCallback)
    } catch (error) {
      // Don't log abort errors as they're intentional
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('PDF export cancelled')
        return
      }
      console.error('PDF generation error:', error)
      throw error
    } finally {
      // Only reset state if this is a standalone call
      if (!isPartOfDownloadAll) {
        setIsExporting(false)
        setExportProgress(null)
        abortControllerRef.current = null
      }
    }
  }, [tokens, generationOptions, getBaseFilename, cancelExport])

  const downloadJson = useCallback(() => {
    if (!jsonInput) return

    const isPartOfDownloadAll = isDownloadingAllRef.current
    
    if (!isPartOfDownloadAll) {
      setIsExporting(true)
      setExportStep('json')
    }
    
    try {
      const blob = new Blob([jsonInput], { type: 'application/json' })
      const filename = `${getBaseFilename()}.json`
      downloadFile(blob, filename)
    } finally {
      if (!isPartOfDownloadAll) {
        setIsExporting(false)
        setExportStep(null)
      }
    }
  }, [jsonInput, getBaseFilename])

  const downloadStyleFormat = useCallback(() => {
    const isPartOfDownloadAll = isDownloadingAllRef.current
    
    if (!isPartOfDownloadAll) {
      setIsExporting(true)
      setExportStep('style')
    }
    
    try {
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
    } finally {
      if (!isPartOfDownloadAll) {
        setIsExporting(false)
        setExportStep(null)
      }
    }
  }, [generationOptions, scriptMeta, getBaseFilename])

  const downloadAll = useCallback(async () => {
    if (tokens.length === 0) return

    // Mark that we're in a downloadAll operation
    isDownloadingAllRef.current = true
    abortControllerRef.current = new AbortController()

    try {
      setIsExporting(true)
      
      const JSZipConstructor = window.JSZip
      if (!JSZipConstructor) {
        throw new Error('JSZip library not loaded')
      }
      
      const zip = new JSZipConstructor()
      const baseFilename = getBaseFilename()
      
      // Step 1: Add JSON
      setExportStep('json')
      if (jsonInput) {
        zip.file(`${baseFilename}.json`, jsonInput)
      }
      
      // Check for cancellation
      if (abortControllerRef.current?.signal.aborted) {
        throw new DOMException('Export cancelled', 'AbortError')
      }
      
      // Step 2: Add Style
      setExportStep('style')
      const styleData = {
        version: '1.0',
        name: scriptMeta?.name ? `${scriptMeta.name} Style` : 'Custom Style',
        generationOptions: generationOptions,
        exportedAt: new Date().toISOString(),
      }
      zip.file(`${baseFilename}_style.json`, JSON.stringify(styleData, null, 2))
      
      // Check for cancellation
      if (abortControllerRef.current?.signal.aborted) {
        throw new DOMException('Export cancelled', 'AbortError')
      }
      
      // Step 3: Add tokens to a tokens folder
      setExportStep('zip')
      setExportProgress({ current: 0, total: tokens.length })
      
      const zipSettings: ZipExportOptions = {
        saveInTeamFolders: generationOptions.zipSettings?.saveInTeamFolders ?? true,
        saveRemindersSeparately: generationOptions.zipSettings?.saveRemindersSeparately ?? true,
        metaTokenFolder: generationOptions.zipSettings?.metaTokenFolder ?? true,
        includeScriptJson: false,
        compressionLevel: generationOptions.zipSettings?.compressionLevel ?? 'normal',
      }
      
      // Process tokens in parallel batches for better performance
      const BATCH_SIZE = 10
      for (let batchStart = 0; batchStart < tokens.length; batchStart += BATCH_SIZE) {
        // Check for cancellation
        if (abortControllerRef.current?.signal.aborted) {
          throw new DOMException('Export cancelled', 'AbortError')
        }
        
        const batchEnd = Math.min(batchStart + BATCH_SIZE, tokens.length)
        const batch = tokens.slice(batchStart, batchEnd)
        
        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map(async (token) => {
            const blob = await processTokenToBlob(token, generationOptions.pngSettings)
            const filename = getTokenFilename(token)
            const folderPath = getTokenFolderPath(token, zipSettings)
            return { blob, path: `tokens/${folderPath}${filename}` }
          })
        )
        
        // Add batch results to zip
        for (const { blob, path } of batchResults) {
          zip.file(path, blob)
        }
        
        setExportProgress({ current: batchEnd, total: tokens.length })
        
        // Yield to UI between batches
        await new Promise(resolve => setTimeout(resolve, 0))
      }
      
      // Check for cancellation
      if (abortControllerRef.current?.signal.aborted) {
        throw new DOMException('Export cancelled', 'AbortError')
      }
      
      // Step 4: Add PDF
      setExportStep('pdf')
      // PDF progress is by page, not token - we don't know page count yet, so show indeterminate briefly
      setExportProgress(null)
      
      const pdfGenerator = new PDFGenerator({
        tokenPadding: generationOptions.pdfPadding ?? 75,
        xOffset: generationOptions.pdfXOffset ?? 0,
        yOffset: generationOptions.pdfYOffset ?? 0,
      })
      
      const pdfProgressCallback: ProgressCallback = (currentPage, totalPages) => {
        if (abortControllerRef.current?.signal.aborted) {
          throw new DOMException('Export cancelled', 'AbortError')
        }
        setExportProgress({ current: currentPage, total: totalPages })
      }
      
      const pdfBlob = await pdfGenerator.getPDFBlob(tokens, pdfProgressCallback)
      zip.file(`${baseFilename}.pdf`, pdfBlob)
      
      // Check for cancellation
      if (abortControllerRef.current?.signal.aborted) {
        throw new DOMException('Export cancelled', 'AbortError')
      }
      
      // Generate final ZIP
      setExportStep(null)
      setExportProgress(null)
      
      const finalBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })
      
      downloadFile(finalBlob, `${baseFilename}_complete.zip`)
    } catch (error) {
      // Don't log abort errors as they're intentional
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Download All cancelled')
        return
      }
      console.error('Download All error:', error)
      throw error
    } finally {
      isDownloadingAllRef.current = false
      abortControllerRef.current = null
      setIsExporting(false)
      setExportProgress(null)
      setExportStep(null)
    }
  }, [tokens, generationOptions, scriptMeta, jsonInput, getBaseFilename])

  return {
    downloadZip,
    downloadPdf,
    downloadJson,
    downloadStyleFormat,
    downloadAll,
    cancelExport,
    isExporting,
    exportProgress,
    exportStep,
    getBaseFilename,
  }
}
