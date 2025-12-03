import { memo, useState, useMemo } from 'react'
import { useTokenContext } from '../../contexts/TokenContext'
import { useExport } from '../../hooks/useExport'
import { useToast } from '../../contexts/ToastContext'
import { OptionGroup } from '../Shared/OptionGroup'
import { SliderWithValue } from '../Shared/SliderWithValue'
import styles from '../../styles/components/views/Views.module.css'
import type { CompressionLevel, ZipExportOptions } from '../../ts/types/index'

const DEFAULT_ZIP_SETTINGS: ZipExportOptions = {
  saveInTeamFolders: true,
  saveRemindersSeparately: true,
  metaTokenFolder: true,
  includeScriptJson: false,
  compressionLevel: 'normal'
}

export function DownloadView() {
  const { tokens, generationOptions, updateGenerationOptions } = useTokenContext()
  const { downloadZip, downloadPdf, downloadJson, downloadStyleFormat, downloadAll, cancelExport, isExporting, exportProgress, exportStep } = useExport()
  const { addToast } = useToast()
  const [activeSubTab, setActiveSubTab] = useState<'png' | 'zip' | 'pdf'>('zip')

  // Ensure zipSettings has all required fields
  const zipSettings = useMemo(() => ({
    ...DEFAULT_ZIP_SETTINGS,
    ...generationOptions.zipSettings
  }), [generationOptions.zipSettings])

  const handleDownloadZip = async () => {
    try {
      await downloadZip()
      addToast('ZIP file downloaded successfully', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      addToast(`Failed to create ZIP: ${message}`, 'error')
    }
  }

  const handleDownloadPdf = async () => {
    try {
      await downloadPdf()
      addToast('PDF downloaded successfully', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      addToast(`Failed to generate PDF: ${message}`, 'error')
    }
  }

  const handleDownloadJson = () => {
    try {
      downloadJson()
      addToast('JSON downloaded successfully', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      addToast(`Failed to download JSON: ${message}`, 'error')
    }
  }

  const handleDownloadStyleFormat = () => {
    try {
      downloadStyleFormat()
      addToast('Style format downloaded successfully', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      addToast(`Failed to download style: ${message}`, 'error')
    }
  }

  const handleDownloadAll = async () => {
    try {
      await downloadAll()
      addToast('All files downloaded successfully', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      addToast(`Failed to download all: ${message}`, 'error')
    }
  }

  const getButtonText = (type: 'zip' | 'pdf') => {
    if (!isExporting) {
      return type === 'zip' ? 'Download ZIP' : 'Download PDF'
    }
    if (exportProgress) {
      return `Exporting ${exportProgress.current}/${exportProgress.total}...`
    }
    return 'Exporting...'
  }

  const hasTokens = tokens.length > 0

  return (
    <div className={styles.exportView}>
      <div className={styles.exportTwoColumn}>
        {/* Left Column: Export Settings */}
        <div className={styles.exportOptionsColumn}>
          <h2>Export Settings</h2>
          
          <div className={styles.subtabsContainer}>
            <div className={styles.subtabsNav}>
              <button
                className={`${styles.subtabButton} ${activeSubTab === 'png' ? styles.active : ''}`}
                onClick={() => setActiveSubTab('png')}
              >
                PNG
              </button>
              <button
                className={`${styles.subtabButton} ${activeSubTab === 'zip' ? styles.active : ''}`}
                onClick={() => setActiveSubTab('zip')}
              >
                ZIP
              </button>
              <button
                className={`${styles.subtabButton} ${activeSubTab === 'pdf' ? styles.active : ''}`}
                onClick={() => setActiveSubTab('pdf')}
              >
                PDF
              </button>
            </div>

            {/* PNG Settings */}
            {activeSubTab === 'png' && (
              <div className={styles.subtabContent}>
                <div className={styles.subsection}>
                  <OptionGroup
                    label="Embed Metadata"
                    helpText="Include character info (name, team, ability) in PNG file metadata"
                  >
                    <input
                      type="checkbox"
                      className={styles.toggleSwitch}
                      checked={generationOptions.pngSettings?.embedMetadata ?? false}
                      onChange={(e) => updateGenerationOptions({
                        pngSettings: {
                          ...generationOptions.pngSettings,
                          embedMetadata: e.target.checked,
                          transparentBackground: generationOptions.pngSettings?.transparentBackground ?? false
                        }
                      })}
                    />
                  </OptionGroup>

                  <OptionGroup
                    label="Transparent Background"
                    helpText="Skip solid color fill (decorative background image is still drawn)"
                  >
                    <input
                      type="checkbox"
                      className={styles.toggleSwitch}
                      checked={generationOptions.pngSettings?.transparentBackground ?? false}
                      onChange={(e) => updateGenerationOptions({
                        pngSettings: {
                          ...generationOptions.pngSettings,
                          embedMetadata: generationOptions.pngSettings?.embedMetadata ?? false,
                          transparentBackground: e.target.checked
                        }
                      })}
                    />
                  </OptionGroup>
                </div>
              </div>
            )}

            {/* ZIP Settings */}
            {activeSubTab === 'zip' && (
              <div className={styles.subtabContent}>
                <div className={styles.subsection}>
                  <OptionGroup
                    label="Save in Team Folders"
                    helpText="Organize exported tokens by team (Townsfolk, Outsider, etc.)"
                  >
                    <input
                      type="checkbox"
                      className={styles.toggleSwitch}
                      checked={zipSettings.saveInTeamFolders}
                      onChange={(e) => updateGenerationOptions({
                        zipSettings: {
                          ...zipSettings,
                          saveInTeamFolders: e.target.checked,
                        }
                      })}
                    />
                  </OptionGroup>

                  <OptionGroup
                    label="Save Reminders Separately"
                    helpText="Place reminder tokens in a separate folder from character tokens"
                  >
                    <input
                      type="checkbox"
                      className={styles.toggleSwitch}
                      checked={zipSettings.saveRemindersSeparately}
                      onChange={(e) => updateGenerationOptions({
                        zipSettings: {
                          ...zipSettings,
                          saveRemindersSeparately: e.target.checked,
                        }
                      })}
                    />
                  </OptionGroup>

                  <OptionGroup
                    label="Meta Token Folder"
                    helpText="Place script name, almanac, and pandemonium tokens in a _meta folder"
                  >
                    <input
                      type="checkbox"
                      className={styles.toggleSwitch}
                      checked={zipSettings.metaTokenFolder}
                      onChange={(e) => updateGenerationOptions({
                        zipSettings: {
                          ...zipSettings,
                          metaTokenFolder: e.target.checked,
                        }
                      })}
                    />
                  </OptionGroup>

                  <OptionGroup
                    label="Include Script JSON"
                    helpText="Bundle the source script.json file in the ZIP"
                  >
                    <input
                      type="checkbox"
                      className={styles.toggleSwitch}
                      checked={zipSettings.includeScriptJson}
                      onChange={(e) => updateGenerationOptions({
                        zipSettings: {
                          ...zipSettings,
                          includeScriptJson: e.target.checked,
                        }
                      })}
                    />
                  </OptionGroup>

                  <OptionGroup
                    label="Compression Level"
                    helpText="Higher compression = smaller file but slower export"
                  >
                    <select
                      className={styles.selectInput}
                      value={zipSettings.compressionLevel}
                      onChange={(e) => updateGenerationOptions({
                        zipSettings: {
                          ...zipSettings,
                          compressionLevel: e.target.value as CompressionLevel
                        }
                      })}
                    >
                      <option value="fast">Fast (larger file)</option>
                      <option value="normal">Normal (balanced)</option>
                      <option value="maximum">Maximum (smaller file)</option>
                    </select>
                  </OptionGroup>
                </div>
              </div>
            )}

            {/* PDF Settings */}
            {activeSubTab === 'pdf' && (
              <div className={styles.subtabContent}>
                <div className={styles.subsection}>
                  <OptionGroup label="Padding" helpText="Padding around PDF content">
                    <div className={styles.inputWithUnit}>
                      <input
                        type="number"
                        className={styles.numberInput}
                        value={generationOptions.pdfPadding || 75}
                        onChange={(e) => updateGenerationOptions({ pdfPadding: parseInt(e.target.value) || 0 })}
                        min={0}
                        max={100}
                      />
                      <span className={styles.inputUnit}>px</span>
                    </div>
                  </OptionGroup>

                  <OptionGroup
                    label="X Offset"
                    helpText="Horizontal offset for PDF content"
                    isSlider
                  >
                    <SliderWithValue
                      value={generationOptions.pdfXOffset || 0}
                      onChange={(value) => updateGenerationOptions({ pdfXOffset: value })}
                      min={-20}
                      max={20}
                      defaultValue={0}
                      unit="mm"
                      ariaLabel="PDF X Offset value"
                    />
                  </OptionGroup>

                  <OptionGroup
                    label="Y Offset"
                    helpText="Vertical offset for PDF content"
                    isSlider
                  >
                    <SliderWithValue
                      value={generationOptions.pdfYOffset || 0}
                      onChange={(value) => updateGenerationOptions({ pdfYOffset: value })}
                      min={-20}
                      max={20}
                      defaultValue={0}
                      unit="mm"
                      ariaLabel="PDF Y Offset value"
                    />
                  </OptionGroup>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Download Actions */}
        <div className={styles.exportActionsColumn}>
          <h2>Download</h2>
          {hasTokens ? (
            <p className={styles.exportSummary}>
              {tokens.length} token{tokens.length !== 1 ? 's' : ''} ready for export
            </p>
          ) : (
            <div className={styles.noTokensMessage}>
              <p>No tokens generated yet.</p>
              <p className={styles.noTokensHint}>Generate tokens in the Editor or Gallery tab first, then come back here to download them.</p>
            </div>
          )}
          
          {/* Progress bar - shown during export */}
          {isExporting && (
            <div className={styles.exportProgressContainer}>
              <div className={styles.exportProgressBar}>
                <div 
                  className={`${styles.exportProgressFill} ${!exportProgress ? styles.indeterminate : ''}`}
                  style={exportProgress ? { width: `${Math.round((exportProgress.current / exportProgress.total) * 100)}%` } : undefined}
                />
              </div>
              <span className={styles.exportProgressText}>
                {exportProgress 
                  ? `${exportProgress.current}/${exportProgress.total} (${Math.round((exportProgress.current / exportProgress.total) * 100)}%)`
                  : 'Processing...'
                }
              </span>
              {exportStep && (
                <div className={styles.exportStepIndicator}>
                  <span className={`${styles.exportStepItem} ${exportStep === 'json' ? styles.active : styles.completed}`}>
                    {exportStep === 'json' ? '⏳' : '✓'} JSON
                  </span>
                  <span className={`${styles.exportStepItem} ${exportStep === 'style' ? styles.active : exportStep === 'json' ? '' : styles.completed}`}>
                    {exportStep === 'style' ? '⏳' : exportStep === 'json' ? '○' : '✓'} Style
                  </span>
                  <span className={`${styles.exportStepItem} ${exportStep === 'zip' ? styles.active : exportStep === 'pdf' ? styles.completed : ''}`}>
                    {exportStep === 'zip' ? '⏳' : (exportStep === 'json' || exportStep === 'style') ? '○' : '✓'} Tokens
                  </span>
                  <span className={`${styles.exportStepItem} ${exportStep === 'pdf' ? styles.active : ''}`}>
                    {exportStep === 'pdf' ? '⏳' : '○'} PDF
                  </span>
                </div>
              )}
              <button
                className={`btn-secondary ${styles.cancelExportBtn}`}
                onClick={cancelExport}
                title="Cancel export"
              >
                ✕ Cancel
              </button>
            </div>
          )}
          
          <div className={styles.exportButtons}>
            <button
              className={`btn-primary ${styles.btnExport} ${styles.btnExportAll}`}
              onClick={handleDownloadAll}
              disabled={isExporting || !hasTokens}
            >
              <span className={styles.btnIcon}>📥</span>
              <span className={styles.btnText}>{isExporting ? 'Downloading...' : 'Download All'}</span>
              <span className={styles.btnHint}>ZIP + PDF + JSON + Style</span>
            </button>
            
            <div className={styles.exportButtonsGrid}>
              <button
                className={`btn-secondary ${styles.btnExportSmall}`}
                onClick={handleDownloadZip}
                disabled={isExporting || !hasTokens}
              >
                <span className={styles.btnIcon}>📦</span>
                <span className={styles.btnText}>Download Token Images</span>
              </button>
              
              <button
                className={`btn-secondary ${styles.btnExportSmall}`}
                onClick={handleDownloadPdf}
                disabled={isExporting || !hasTokens}
              >
                <span className={styles.btnIcon}>🖨️</span>
                <span className={styles.btnText}>Download Token Print Sheet</span>
              </button>
              
              <button
                className={`btn-secondary ${styles.btnExportSmall}`}
                onClick={handleDownloadJson}
                disabled={isExporting || !hasTokens}
              >
                <span className={styles.btnIcon}>📋</span>
                <span className={styles.btnText}>Download JSON</span>
              </button>
              
              <button
                className={`btn-secondary ${styles.btnExportSmall}`}
                onClick={handleDownloadStyleFormat}
                disabled={isExporting || !hasTokens}
              >
                <span className={styles.btnIcon}>🎨</span>
                <span className={styles.btnText}>Download Style Format</span>
              </button>
              
              <button
                className={`btn-secondary ${styles.btnExportSmall}`}
                disabled={true}
                title="Coming soon"
              >
                <span className={styles.btnIcon}>📜</span>
                <span className={styles.btnText}>Download Script</span>
                <span className={styles.btnBadge}>Soon</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
