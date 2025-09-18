import { useState, useRef } from 'react';
import { 
  XMarkIcon, 
  DocumentArrowUpIcon,
  CheckIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import importService from '../../services/importService';
import useNoteStore from '../../store/noteStore';

const ImportModal = ({ isOpen, onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [importOptions, setImportOptions] = useState({
    categoryId: null,
    addToFavorites: false,
    preserveMetadata: true,
    conflictResolution: 'rename'
  });
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  
  const fileInputRef = useRef(null);
  const { loadNotes } = useNoteStore();

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    
    // Generate previews for the first few files
    const previews = [];
    for (let i = 0; i < Math.min(files.length, 3); i++) {
      try {
        const preview = await importService.previewImport(files[i]);
        previews.push({ filename: files[i].name, ...preview });
      } catch (error) {
        previews.push({ 
          filename: files[i].name, 
          error: error.message 
        });
      }
    }
    setPreviewData(previews);
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await importService.importFiles(selectedFiles, importOptions);
      setImportResult(result);
      
      // Refresh notes list
      await loadNotes();
      
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        successful: [],
        failed: [{ filename: 'Import', error: error.message }],
        skipped: []
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setPreviewData([]);
    setImportResult(null);
    onClose();
  };

  const getImportStats = () => {
    if (!importResult) return null;
    
    const total = importResult.successful.length + importResult.failed.length + importResult.skipped.length;
    const successRate = total > 0 ? (importResult.successful.length / total * 100).toFixed(1) : 0;
    
    return { total, successRate, ...importResult };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Import Notes
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Files to Import
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".md,.markdown,.txt,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">
                Drag and drop files here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-500">
                Supports: Markdown (.md), Text (.txt), JSON (.json)
              </p>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">
                  Selected {selectedFiles.length} file(s):
                </p>
                <div className="space-y-1">
                  {selectedFiles.slice(0, 5).map((file, index) => (
                    <div key={index} className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  ))}
                  {selectedFiles.length > 5 && (
                    <div className="text-sm text-gray-500">
                      ... and {selectedFiles.length - 5} more files
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="space-y-2">
                {previewData.map((preview, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="font-medium text-gray-900">{preview.filename}</div>
                    {preview.error ? (
                      <div className="text-red-600 text-sm mt-1">
                        Error: {preview.error}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 mt-1">
                        <div><strong>Title:</strong> {preview.title}</div>
                        {preview.wordCount && (
                          <div><strong>Words:</strong> {preview.wordCount}</div>
                        )}
                        {preview.contentPreview && (
                          <div className="mt-2 text-gray-500 italic">
                            "{preview.contentPreview}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Import Options
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={importOptions.addToFavorites}
                onChange={(e) => setImportOptions(prev => ({
                  ...prev,
                  addToFavorites: e.target.checked
                }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Add imported notes to favorites</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={importOptions.preserveMetadata}
                onChange={(e) => setImportOptions(prev => ({
                  ...prev,
                  preserveMetadata: e.target.checked
                }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Preserve original metadata (dates, tags)</span>
            </label>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                If note with same title exists:
              </label>
              <select
                value={importOptions.conflictResolution}
                onChange={(e) => setImportOptions(prev => ({
                  ...prev,
                  conflictResolution: e.target.value
                }))}
                className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="rename">Create with new name</option>
                <option value="overwrite">Overwrite existing</option>
                <option value="skip">Skip import</option>
              </select>
            </div>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Import Results</h3>
              
              {(() => {
                const stats = getImportStats();
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Total files processed:</span>
                      <span className="font-medium">{stats.total}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Success rate:</span>
                      <span className="font-medium">{stats.successRate}%</span>
                    </div>
                    
                    {stats.successful.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center text-green-700 text-sm mb-1">
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Successfully imported ({stats.successful.length})
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          {stats.successful.slice(0, 3).map((item, index) => (
                            <div key={index}>• {item.filename} → "{item.title}"</div>
                          ))}
                          {stats.successful.length > 3 && (
                            <div>... and {stats.successful.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {stats.failed.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center text-red-700 text-sm mb-1">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          Failed to import ({stats.failed.length})
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          {stats.failed.map((item, index) => (
                            <div key={index}>• {item.filename}: {item.error}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            {importResult ? 'Close' : 'Cancel'}
          </button>
          {!importResult && (
            <button
              onClick={handleImport}
              disabled={isImporting || selectedFiles.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <DocumentArrowUpIcon className="w-4 h-4" />
                  Import {selectedFiles.length} file(s)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
