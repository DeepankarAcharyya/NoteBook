// Simple localStorage-based database for development/demo purposes
// This can be replaced with SQLite later when native modules are properly configured

class LocalStorageDatabase {
  constructor() {
    this.isInitialized = false;
    this.storageKeys = {
      notes: 'notebook_notes',
      categories: 'notebook_categories',
      tags: 'notebook_tags',
      settings: 'notebook_settings',
      noteIdCounter: 'notebook_note_id_counter',
      categoryIdCounter: 'notebook_category_id_counter',
      tagIdCounter: 'notebook_tag_id_counter'
    };
  }

  async initialize() {
    try {
      // Initialize default data if not exists
      if (!localStorage.getItem(this.storageKeys.notes)) {
        localStorage.setItem(this.storageKeys.notes, JSON.stringify([]));
      }
      
      if (!localStorage.getItem(this.storageKeys.categories)) {
        const defaultCategories = [
          {
            id: 1,
            name: 'General',
            color: '#6B7280',
            parent_id: null,
            created_at: new Date().toISOString()
          }
        ];
        localStorage.setItem(this.storageKeys.categories, JSON.stringify(defaultCategories));
        localStorage.setItem(this.storageKeys.categoryIdCounter, '2');
      }
      
      if (!localStorage.getItem(this.storageKeys.tags)) {
        localStorage.setItem(this.storageKeys.tags, JSON.stringify([]));
      }
      
      if (!localStorage.getItem(this.storageKeys.settings)) {
        const defaultSettings = {
          theme: 'light',
          editor_font_size: '14',
          editor_font_family: 'JetBrains Mono',
          auto_save_interval: '2000',
          show_preview: 'true',
          sidebar_width: '300'
        };
        localStorage.setItem(this.storageKeys.settings, JSON.stringify(defaultSettings));
      }
      
      if (!localStorage.getItem(this.storageKeys.noteIdCounter)) {
        localStorage.setItem(this.storageKeys.noteIdCounter, '1');
      }
      
      if (!localStorage.getItem(this.storageKeys.tagIdCounter)) {
        localStorage.setItem(this.storageKeys.tagIdCounter, '1');
      }

      this.isInitialized = true;
      console.log('LocalStorage database initialized successfully');
      
      return this;
    } catch (error) {
      console.error('Failed to initialize localStorage database:', error);
      throw error;
    }
  }

  getDatabase() {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this;
  }

  // Helper methods for data operations
  getNextId(counterKey) {
    const currentId = parseInt(localStorage.getItem(counterKey) || '1');
    localStorage.setItem(counterKey, (currentId + 1).toString());
    return currentId;
  }

  // Notes operations
  createNote(noteData) {
    const notes = JSON.parse(localStorage.getItem(this.storageKeys.notes) || '[]');
    const id = this.getNextId(this.storageKeys.noteIdCounter);
    
    const note = {
      id,
      title: noteData.title || 'Untitled',
      content: noteData.content || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category_id: noteData.category_id || null,
      is_favorite: noteData.is_favorite || false,
      is_archived: false
    };
    
    notes.unshift(note); // Add to beginning
    localStorage.setItem(this.storageKeys.notes, JSON.stringify(notes));
    
    return this.findNoteById(id);
  }

  findNoteById(id) {
    const notes = JSON.parse(localStorage.getItem(this.storageKeys.notes) || '[]');
    const note = notes.find(n => n.id === id);
    
    if (note) {
      // Add category info
      const categories = JSON.parse(localStorage.getItem(this.storageKeys.categories) || '[]');
      const category = categories.find(c => c.id === note.category_id);
      if (category) {
        note.category_name = category.name;
        note.category_color = category.color;
      }
    }
    
    return note;
  }

  findAllNotes() {
    const notes = JSON.parse(localStorage.getItem(this.storageKeys.notes) || '[]');
    const categories = JSON.parse(localStorage.getItem(this.storageKeys.categories) || '[]');
    
    return notes
      .filter(note => !note.is_archived)
      .map(note => {
        const category = categories.find(c => c.id === note.category_id);
        return {
          ...note,
          category_name: category?.name,
          category_color: category?.color
        };
      })
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  updateNote(id, noteData) {
    const notes = JSON.parse(localStorage.getItem(this.storageKeys.notes) || '[]');
    const index = notes.findIndex(n => n.id === id);
    
    if (index === -1) {
      throw new Error('Note not found');
    }
    
    notes[index] = {
      ...notes[index],
      ...noteData,
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem(this.storageKeys.notes, JSON.stringify(notes));
    return this.findNoteById(id);
  }

  deleteNote(id) {
    const notes = JSON.parse(localStorage.getItem(this.storageKeys.notes) || '[]');
    const filteredNotes = notes.filter(n => n.id !== id);
    
    if (filteredNotes.length === notes.length) {
      return false; // Note not found
    }
    
    localStorage.setItem(this.storageKeys.notes, JSON.stringify(filteredNotes));
    return true;
  }

  searchNotes(query) {
    const notes = this.findAllNotes();
    const searchTerm = query.toLowerCase();
    
    return notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm)
    );
  }

  findFavoriteNotes() {
    return this.findAllNotes().filter(note => note.is_favorite);
  }

  findRecentNotes(limit = 10) {
    return this.findAllNotes().slice(0, limit);
  }

  // Categories operations
  findAllCategories() {
    return JSON.parse(localStorage.getItem(this.storageKeys.categories) || '[]');
  }

  // Tags operations (simplified for now)
  findTagsByNote(noteId) {
    // For now, return empty array - tags can be implemented later
    return [];
  }

  // Transaction helper (no-op for localStorage)
  transaction(fn) {
    return fn();
  }

  // Backup (export to JSON)
  backup() {
    return {
      notes: JSON.parse(localStorage.getItem(this.storageKeys.notes) || '[]'),
      categories: JSON.parse(localStorage.getItem(this.storageKeys.categories) || '[]'),
      tags: JSON.parse(localStorage.getItem(this.storageKeys.tags) || '[]'),
      settings: JSON.parse(localStorage.getItem(this.storageKeys.settings) || '{}')
    };
  }

  // Restore from backup
  restore(data) {
    if (data.notes) localStorage.setItem(this.storageKeys.notes, JSON.stringify(data.notes));
    if (data.categories) localStorage.setItem(this.storageKeys.categories, JSON.stringify(data.categories));
    if (data.tags) localStorage.setItem(this.storageKeys.tags, JSON.stringify(data.tags));
    if (data.settings) localStorage.setItem(this.storageKeys.settings, JSON.stringify(data.settings));
  }

  close() {
    this.isInitialized = false;
    console.log('LocalStorage database connection closed');
  }
}

// Singleton instance
const localStorageDb = new LocalStorageDatabase();

export default localStorageDb;
