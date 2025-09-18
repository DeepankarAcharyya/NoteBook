import noteService from './noteService.js';
import markdownService from './markdownService.js';

class SearchService {
  constructor() {
    this.searchIndex = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await this.buildSearchIndex();
      this.initialized = true;
    }
  }

  // Build search index for better performance
  async buildSearchIndex() {
    try {
      const notes = await noteService.getAllNotes();
      this.searchIndex.clear();

      notes.forEach(note => {
        const searchableContent = this.extractSearchableContent(note);
        this.searchIndex.set(note.id, {
          ...note,
          searchableContent,
          searchTerms: this.generateSearchTerms(searchableContent)
        });
      });

      console.log(`Search index built with ${this.searchIndex.size} notes`);
    } catch (error) {
      console.error('Failed to build search index:', error);
    }
  }

  // Extract searchable content from note
  extractSearchableContent(note) {
    const title = note.title || '';
    const content = markdownService.extractPlainText(note.content || '');
    const categoryName = note.category_name || '';
    const tags = note.tags ? note.tags.map(tag => tag.name).join(' ') : '';
    
    return `${title} ${content} ${categoryName} ${tags}`.toLowerCase();
  }

  // Generate search terms for indexing
  generateSearchTerms(content) {
    return content
      .split(/\s+/)
      .filter(term => term.length > 2)
      .map(term => term.replace(/[^\w]/g, ''))
      .filter(term => term.length > 0);
  }

  // Advanced search with multiple criteria
  async search(query, options = {}) {
    await this.initialize();

    const {
      categoryId = null,
      tags = [],
      isFavorite = null,
      dateRange = null,
      sortBy = 'relevance', // 'relevance', 'date', 'title'
      limit = 50
    } = options;

    if (!query && !categoryId && tags.length === 0 && isFavorite === null) {
      return await noteService.getAllNotes();
    }

    let results = Array.from(this.searchIndex.values());

    // Apply filters
    if (query) {
      results = this.filterByQuery(results, query);
    }

    if (categoryId) {
      results = results.filter(note => note.category_id === categoryId);
    }

    if (tags.length > 0) {
      results = results.filter(note => 
        note.tags && note.tags.some(tag => tags.includes(tag.id))
      );
    }

    if (isFavorite !== null) {
      results = results.filter(note => note.is_favorite === isFavorite);
    }

    if (dateRange) {
      results = this.filterByDateRange(results, dateRange);
    }

    // Sort results
    results = this.sortResults(results, sortBy, query);

    // Limit results
    return results.slice(0, limit);
  }

  // Filter by search query with scoring
  filterByQuery(notes, query) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    return notes
      .map(note => ({
        ...note,
        score: this.calculateRelevanceScore(note, queryTerms)
      }))
      .filter(note => note.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  // Calculate relevance score for ranking
  calculateRelevanceScore(note, queryTerms) {
    let score = 0;
    const title = (note.title || '').toLowerCase();
    const content = note.searchableContent;

    queryTerms.forEach(term => {
      // Title matches get higher score
      if (title.includes(term)) {
        score += 10;
      }

      // Exact content matches
      if (content.includes(term)) {
        score += 5;
      }

      // Fuzzy matches in search terms
      const fuzzyMatches = note.searchTerms.filter(searchTerm => 
        searchTerm.includes(term) || term.includes(searchTerm)
      );
      score += fuzzyMatches.length * 2;

      // Category and tag matches
      if (note.category_name && note.category_name.toLowerCase().includes(term)) {
        score += 3;
      }

      if (note.tags) {
        note.tags.forEach(tag => {
          if (tag.name.toLowerCase().includes(term)) {
            score += 3;
          }
        });
      }
    });

    return score;
  }

  // Filter by date range
  filterByDateRange(notes, dateRange) {
    const { start, end } = dateRange;
    const startDate = new Date(start);
    const endDate = new Date(end);

    return notes.filter(note => {
      const noteDate = new Date(note.updated_at);
      return noteDate >= startDate && noteDate <= endDate;
    });
  }

  // Sort results by different criteria
  sortResults(results, sortBy, query = '') {
    switch (sortBy) {
      case 'date':
        return results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      
      case 'title':
        return results.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      
      case 'relevance':
      default:
        // If we have query and scores, sort by score; otherwise by date
        if (query && results[0]?.score !== undefined) {
          return results.sort((a, b) => b.score - a.score);
        }
        return results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }
  }

  // Get search suggestions
  async getSearchSuggestions(query, limit = 5) {
    await this.initialize();

    if (!query || query.length < 2) {
      return [];
    }

    const suggestions = new Set();
    const queryLower = query.toLowerCase();

    // Get suggestions from titles
    this.searchIndex.forEach(note => {
      const title = note.title || '';
      if (title.toLowerCase().includes(queryLower)) {
        suggestions.add(title);
      }
    });

    // Get suggestions from tags
    this.searchIndex.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          if (tag.name.toLowerCase().includes(queryLower)) {
            suggestions.add(tag.name);
          }
        });
      }
    });

    // Get suggestions from categories
    this.searchIndex.forEach(note => {
      if (note.category_name && note.category_name.toLowerCase().includes(queryLower)) {
        suggestions.add(note.category_name);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  // Update search index when notes change
  async updateNoteInIndex(note) {
    if (!this.initialized) return;

    const searchableContent = this.extractSearchableContent(note);
    this.searchIndex.set(note.id, {
      ...note,
      searchableContent,
      searchTerms: this.generateSearchTerms(searchableContent)
    });
  }

  // Remove note from search index
  removeNoteFromIndex(noteId) {
    this.searchIndex.delete(noteId);
  }

  // Get search statistics
  getSearchStats() {
    return {
      totalNotes: this.searchIndex.size,
      totalTerms: Array.from(this.searchIndex.values())
        .reduce((total, note) => total + note.searchTerms.length, 0),
      avgTermsPerNote: this.searchIndex.size > 0 
        ? Array.from(this.searchIndex.values())
            .reduce((total, note) => total + note.searchTerms.length, 0) / this.searchIndex.size
        : 0
    };
  }

  // Rebuild index (useful after bulk operations)
  async rebuildIndex() {
    this.initialized = false;
    await this.initialize();
  }
}

export default new SearchService();
