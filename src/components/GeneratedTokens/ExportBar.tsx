import { useTokenContext } from '../../contexts/TokenContext'
import { useExport } from '../../hooks/useExport'
import { useToast } from '../../contexts/ToastContext'

export function ExportBar() {
  const { tokens } = useTokenContext()
  const { downloadZip, downloadPdf, isExporting, exportProgress } = useExport()
  const { addToast } = useToast()

  // Don't show if no tokens generated
  if (tokens.length === 0) {
    return null
  }

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

  const getButtonText = (type: 'zip' | 'pdf') => {
    if (!isExporting) {
      return type === 'zip' ? 'Download ZIP' : 'Download PDF'
    }
    if (exportProgress) {
      return `${exportProgress.current}/${exportProgress.total}`
    }
    return 'Exporting...'
  }

  return (
    <div className="sticky-export-bar">
      <div className="export-token-count">
        {tokens.length} token{tokens.length !== 1 ? 's' : ''} generated
      </div>
      <div className="sticky-export-bar-content">
        <button
          className="btn-primary"
          onClick={handleDownloadZip}
          disabled={isExporting}
        >
          <span className="btn-icon">📦</span>
          {getButtonText('zip')}
        </button>
        <button
          className="btn-secondary"
          onClick={handleDownloadPdf}
          disabled={isExporting}
        >
          <span className="btn-icon">📄</span>
          {getButtonText('pdf')}
        </button>
      </div>
    </div>
  )
}
