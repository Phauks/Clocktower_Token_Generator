import { memo, useState, useMemo } from 'react'
import { useTokenContext } from '../../contexts/TokenContext'
import { useExport } from '../../hooks/useExport'
import { useToast } from '../../contexts/ToastContext'
import { OptionGroup } from '../Shared/OptionGroup'
import { SliderWithValue } from '../Shared/SliderWithValue'
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
  const { downloadZip, downloadPdf, downloadJson, downloadStyleFormat, downloadAll, isExporting, exportProgress } = useExport()
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

  if (tokens.length === 0) {
    return (
      <div className="export-view export-view-empty">
        <div className="empty-state">
          <h2>No Tokens to Export</h2>
          <p>Generate tokens in the Editor or Gallery tab first, then come back here to download them.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="export-view">
      <div className="export-two-column">
        {/* Left Column: Export Settings */}
        <div className="export-options-column">
          <h2>Export Settings</h2>
          
          <div className="subtabs-container">
            <div className="subtabs-nav">
              <button
                className={`subtab-button ${activeSubTab === 'png' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('png')}
              >
                PNG
              </button>
              <button
                className={`subtab-button ${activeSubTab === 'zip' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('zip')}
              >
                ZIP
              </button>
              <button
                className={`subtab-button ${activeSubTab === 'pdf' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('pdf')}
              >
                PDF
              </button>
            </div>

            {/* PNG Settings */}
            {activeSubTab === 'png' && (
              <div className="subtab-content">
                <div className="subsection">
                  <OptionGroup
                    label="Embed Metadata"
                    helpText="Include character info (name, team, ability) in PNG file metadata"
                  >
                    <input
                      type="checkbox"
                      className="toggle-switch"
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
                      className="toggle-switch"
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
              <div className="subtab-content">
                <div className="subsection">
                  <OptionGroup
                    label="Save in Team Folders"
                    helpText="Organize exported tokens by team (Townsfolk, Outsider, etc.)"
                  >
                    <input
                      type="checkbox"
                      className="toggle-switch"
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
                      className="toggle-switch"
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
                      className="toggle-switch"
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
                      className="toggle-switch"
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
                      className="select-input"
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
              <div className="subtab-content">
                <div className="subsection">
                  <OptionGroup label="Padding" helpText="Padding around PDF content">
                    <div className="input-with-unit">
                      <input
                        type="number"
                        className="number-input"
                        value={generationOptions.pdfPadding || 75}
                        onChange={(e) => updateGenerationOptions({ pdfPadding: parseInt(e.target.value) || 0 })}
                        min={0}
                        max={100}
                      />
                      <span className="input-unit">px</span>
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
        <div className="export-actions-column">
          <h2>Download</h2>
          <p className="export-summary">
            {tokens.length} token{tokens.length !== 1 ? 's' : ''} ready for export
          </p>
          <div className="export-buttons">
            <button
              className="btn-primary btn-export btn-export-all"
              onClick={handleDownloadAll}
              disabled={isExporting}
            >
              <span className="btn-icon">📥</span>
              <span className="btn-text">{isExporting ? 'Downloading...' : 'Download All'}</span>
              <span className="btn-hint">ZIP + PDF + JSON + Style</span>
            </button>
            
            <div className="export-buttons-grid">
              <button
                className="btn-secondary btn-export-small"
                onClick={handleDownloadZip}
                disabled={isExporting}
              >
                <span className="btn-icon">📦</span>
                <span className="btn-text">Download Token Images</span>
              </button>
              
              <button
                className="btn-secondary btn-export-small"
                onClick={handleDownloadPdf}
                disabled={isExporting}
              >
                <span className="btn-icon">🖨️</span>
                <span className="btn-text">Download Token Print Sheet</span>
              </button>
              
              <button
                className="btn-secondary btn-export-small"
                onClick={handleDownloadJson}
                disabled={isExporting}
              >
                <span className="btn-icon">📋</span>
                <span className="btn-text">Download JSON</span>
              </button>
              
              <button
                className="btn-secondary btn-export-small"
                onClick={handleDownloadStyleFormat}
                disabled={isExporting}
              >
                <span className="btn-icon">🎨</span>
                <span className="btn-text">Download Style Format</span>
              </button>
              
              <button
                className="btn-secondary btn-export-small"
                disabled={true}
                title="Coming soon"
              >
                <span className="btn-icon">📜</span>
                <span className="btn-text">Download Script</span>
                <span className="btn-badge">Soon</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
