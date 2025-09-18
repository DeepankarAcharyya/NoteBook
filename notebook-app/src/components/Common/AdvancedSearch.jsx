import { useState, useEffect, useRef } from 'react';
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  TagIcon,
  FolderIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import searchService from '../../services/searchService';
import useNoteStore from '../../store/noteStore';

const AdvancedSearch = ({ isOpen, onClose, onResults }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    categoryId: null,
    tags: [],
    isFavorite: null,
    dateRange: null,
    sortBy: 'relevance'
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const searchInputRef = useRef(null);
  const { notes } = useNoteStore();

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const getSuggestions = async () => {
      if (query.length >= 2) {
        try {
          const suggestions = await searchService.getSearchSuggestions(query);
          setSuggestions(suggestions);
        } catch (error) {
          console.error('Failed to get suggestions:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(getSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim() && !hasActiveFilters()) {
      onResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchService.search(query, {
        ...filters,
        limit: 100
      });
      onResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      onResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const hasActiveFilters = () => {
    return filters.categoryId || 
           filters.tags.length > 0 || 
           filters.isFavorite !== null || 
           filters.dateRange;
  };

  const clearFilters = () => {
    setFilters({
      categoryId: null,
      tags: [],
      isFavorite: null,
      dateRange: null,
      sortBy: 'relevance'
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const applySuggestion = (suggestion) => {
    setQuery(suggestion);
    setSuggestions([]);
    setTimeout(handleSearch, 100);
  };

  // Get unique categories from notes
  const categories = [...new Set(notes
    .filter(note => note.category_name)
    .map(note => ({ id: note.category_id, name: note.category_name }))
  )];

  // Get unique tags from notes (placeholder - would be implemented with full tag system)
  const availableTags = []; // Would be populated from tag service

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Advanced Search
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search notes..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => applySuggestion(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    <MagnifyingGlassIcon className="inline w-4 h-4 text-gray-400 mr-2" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              Filters
              {hasActiveFilters() && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </button>
            
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              {/* Category Filter */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FolderIcon className="w-4 h-4 mr-1" />
                  Category
                </label>
                <select
                  value={filters.categoryId || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    categoryId: e.target.value || null
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Favorite Filter */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <HeartIcon className="w-4 h-4 mr-1" />
                  Favorites
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      isFavorite: null
                    }))}
                    className={`px-3 py-1 text-sm rounded ${
                      filters.isFavorite === null
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      isFavorite: true
                    }))}
                    className={`px-3 py-1 text-sm rounded ${
                      filters.isFavorite === true
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Favorites only
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      isFavorite: false
                    }))}
                    className={`px-3 py-1 text-sm rounded ${
                      filters.isFavorite === false
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Non-favorites
                  </button>
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort by
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    sortBy: e.target.value
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Last modified</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: {
                        ...prev.dateRange,
                        start: e.target.value
                      }
                    }))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: {
                        ...prev.dateRange,
                        end: e.target.value
                      }
                    }))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="To"
                  />
                </div>
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
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Searching...
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="w-4 h-4" />
                Search
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;
