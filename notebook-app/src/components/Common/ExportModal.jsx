import { useState } from 'react';
import { 
  XMarkIcon, 
  DocumentArrowDownIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import exportService from '../../services/exportService';
import useNoteStore from '../../store/noteStore';

const ExportModal = ({ isOpen, onClose, noteIds = [], exportType = 'selected' }) => {
  const [format, setFormat] = useState('markdown');
  const [options, setOptions] = useState({
    includeIndex: true,
    separateFiles: false,
    includeMetadata: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  const { notes } = useNoteStore();

  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      let result;
      
      if (exportType === 'all') {
        result = await exportService.exportAllNotes(format, options);
      } else if (exportType === 'current' && noteIds.length === 1) {
        result = await exportService.exportNote(noteIds[0], format);
      } else {
        result = await exportService.exportNotes(noteIds, format, options);
      }

      // Download the file
      if (Array.isArray(result)) {
        // Multiple files
        for (const file of result) {
          downloadFile(file.content, file.filename, file.mimeType);
        }
        setExportResult({ success: true, fileCount: result.length });
      } else {
        // Single file
        downloadFile(result.content, result.filename, result.mimeType);
        setExportResult({ success: true, fileCount: 1 });
      }

    } catch (error) {
      console.error('Export failed:', error);
      setExportResult({ success: false, error: error.message });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getExportTitle = () => {
    switch (exportType) {
      case 'all':
        return `Export All Notes (${notes.length} notes)`;
      case 'current':
        return 'Export Current Note';
      case 'selected':
      default:
        return `Export Selected Notes (${noteIds.length} notes)`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {getExportTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="markdown">Markdown (.md)</option>
              <option value="html">HTML (.html)</option>
              <option value="json">JSON (.json)</option>
              <option value="txt">Plain Text (.txt)</option>
            </select>
          </div>

          {/* Options */}
          {(exportType === 'all' || noteIds.length > 1) && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Export Options
              </label>
              
              {format === 'markdown' && (
                <>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeIndex}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        includeIndex: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Include table of contents</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.separateFiles}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        separateFiles: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Export as separate files</span>
                  </label>
                </>
              )}
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeMetadata}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    includeMetadata: e.target.checked
                  }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Include metadata (dates, categories, tags)</span>
              </label>
            </div>
          )}

          {/* Export Result */}
          {exportResult && (
            <div className={`p-3 rounded-md ${
              exportResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                {exportResult.success ? (
                  <CheckIcon className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <XMarkIcon className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className={`text-sm ${
                  exportResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {exportResult.success 
                    ? `Successfully exported ${exportResult.fileCount} file(s)`
                    : `Export failed: ${exportResult.error}`
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="w-4 h-4" />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
