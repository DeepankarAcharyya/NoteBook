import { useState, useEffect } from 'react';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Sidebar from '../Sidebar/Sidebar';
import MarkdownEditor from '../Editor/MarkdownEditor';
import Preview from '../Editor/Preview';
import ExportModal from '../Common/ExportModal';
import ImportModal from '../Common/ImportModal';
import AdvancedSearch from '../Common/AdvancedSearch';
import useNoteStore from '../../store/noteStore';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [exportType, setExportType] = useState('current');
  const [selectedNoteIds, setSelectedNoteIds] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  
  const {
    currentNote,
    searchQuery,
    setSearchQuery,
    searchNotes,
    clearSearch,
    isLoading,
    error
  } = useNoteStore();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            setSidebarOpen(prev => !prev);
            break;
          case 'e':
            e.preventDefault();
            setShowPreview(prev => !prev);
            break;
          case 'f':
            e.preventDefault();
            if (e.shiftKey) {
              setShowAdvancedSearch(true);
            } else {
              setSearchFocused(true);
            }
            break;
          case 'n':
            e.preventDefault();
            // Handle new note creation
            break;
          case 'i':
            if (e.shiftKey) {
              e.preventDefault();
              setShowImportModal(true);
            }
            break;
          case 'o':
            if (e.shiftKey) {
              e.preventDefault();
              handleExportCurrent();
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentNote]);

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchNotes(query);
    } else {
      clearSearch();
    }
  };

  // Export handlers
  const handleExportCurrent = () => {
    if (currentNote) {
      setExportType('current');
      setSelectedNoteIds([currentNote.id]);
      setShowExportModal(true);
    }
  };

  const handleExportAll = () => {
    setExportType('all');
    setSelectedNoteIds([]);
    setShowExportModal(true);
  };

  const handleExportSelected = (noteIds) => {
    setExportType('selected');
    setSelectedNoteIds(noteIds);
    setShowExportModal(true);
  };

  // Advanced search handlers
  const handleAdvancedSearchResults = (results) => {
    setSearchResults(results);
    setShowAdvancedSearch(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 bg-white`}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle Sidebar (Cmd+B)"
          >
            <Bars3Icon className="w-5 h-5 text-gray-600" />
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  searchFocused ? 'shadow-md' : ''
                }`}
              />
              <button
                onClick={() => setShowAdvancedSearch(true)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                title="Advanced Search (Cmd+Shift+F)"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Import Notes (Cmd+Shift+I)"
            >
              <DocumentArrowUpIcon className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={handleExportCurrent}
              disabled={!currentNote}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Export Current Note (Cmd+Shift+O)"
            >
              <DocumentArrowDownIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                showPreview 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Toggle Preview (Cmd+E)"
            >
              Preview
            </button>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isLoading && (
              <div className="flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                <span>Loading...</span>
              </div>
            )}
            {error && (
              <div className="text-red-500 text-xs">
                Error: {error}
              </div>
            )}
          </div>
        </header>

        {/* Editor Area */}
        <div className="flex-1 flex">
          {currentNote ? (
            <>
              {/* Editor Pane */}
              <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r border-gray-200`}>
                <MarkdownEditor />
              </div>

              {/* Preview Pane */}
              {showPreview && (
                <div className="w-1/2">
                  <Preview />
                </div>
              )}
            </>
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">📝</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome to NoteBook
                </h2>
                <p className="text-gray-600 mb-6">
                  Select a note from the sidebar to start editing, or create a new note to get started.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div>• <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Cmd+N</kbd> New note</div>
                  <div>• <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Cmd+F</kbd> Search</div>
                  <div>• <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Cmd+E</kbd> Toggle preview</div>
                  <div>• <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Cmd+B</kbd> Toggle sidebar</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <footer className="h-6 bg-gray-100 border-t border-gray-200 flex items-center justify-between px-4 text-xs text-gray-600">
          <div className="flex items-center gap-4">
            {currentNote && (
              <>
                <span>
                  Words: {currentNote.content ? currentNote.content.split(/\s+/).filter(w => w.length > 0).length : 0}
                </span>
                <span>
                  Characters: {currentNote.content ? currentNote.content.length : 0}
                </span>
                <span>
                  Last saved: {currentNote.updated_at ? new Date(currentNote.updated_at).toLocaleTimeString() : 'Never'}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>NoteBook v1.0.0</span>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        noteIds={selectedNoteIds}
        exportType={exportType}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      <AdvancedSearch
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onResults={handleAdvancedSearchResults}
      />
    </div>
  );
};

export default AppLayout;
