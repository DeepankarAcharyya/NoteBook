import { useState } from 'react';
import { 
  PlusIcon, 
  HeartIcon, 
  FolderIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import useNoteStore from '../../store/noteStore';

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState('all');
  
  const {
    notes,
    currentNote,
    createNote,
    setCurrentNote,
    loadNotes,
    loadFavoriteNotes,
    loadRecentNotes,
    toggleFavorite,
    isLoading
  } = useNoteStore();

  const handleCreateNote = async () => {
    try {
      await createNote({
        title: 'Untitled',
        content: '# New Note\n\nStart writing your thoughts here...'
      });
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleNoteSelect = (note) => {
    setCurrentNote(note);
  };

  const handleToggleFavorite = async (e, noteId) => {
    e.stopPropagation();
    try {
      await toggleFavorite(noteId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    
    try {
      switch (tab) {
        case 'all':
          await loadNotes();
          break;
        case 'favorites':
          await loadFavoriteNotes();
          break;
        case 'recent':
          await loadRecentNotes(20);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateContent = (content, maxLength = 100) => {
    if (!content) return '';
    const plainText = content.replace(/[#*`_~\[\]()]/g, '').trim();
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">NoteBook</h1>
          <button
            onClick={handleCreateNote}
            disabled={isLoading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            title="New Note (Cmd+N)"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleTabChange('all')}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <DocumentTextIcon className="w-4 h-4" />
            All
          </button>
          <button
            onClick={() => handleTabChange('favorites')}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === 'favorites'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HeartIcon className="w-4 h-4" />
            Favorites
          </button>
          <button
            onClick={() => handleTabChange('recent')}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === 'recent'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ClockIcon className="w-4 h-4" />
            Recent
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notes found</p>
            <p className="text-xs text-gray-400 mt-1">
              {activeTab === 'all' && 'Create your first note to get started'}
              {activeTab === 'favorites' && 'No favorite notes yet'}
              {activeTab === 'recent' && 'No recent notes'}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleNoteSelect(note)}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors group ${
                  currentNote?.id === note.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-medium text-gray-900 text-sm truncate flex-1">
                    {note.title || 'Untitled'}
                  </h3>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => handleToggleFavorite(e, note.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                    >
                      {note.is_favorite ? (
                        <HeartSolidIcon className="w-4 h-4 text-red-500" />
                      ) : (
                        <HeartIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {truncateContent(note.content)}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{formatDate(note.updated_at)}</span>
                  {note.category_name && (
                    <span className="flex items-center gap-1">
                      <FolderIcon className="w-3 h-3" />
                      {note.category_name}
                    </span>
                  )}
                </div>
                
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag.name}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{note.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
