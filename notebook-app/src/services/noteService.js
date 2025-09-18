import noteRepository from '../database/noteRepository.js';
import tagRepository from '../database/tagRepository.js';
import categoryRepository from '../database/categoryRepository.js';

class NoteService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      noteRepository.initialize();
      tagRepository.initialize();
      categoryRepository.initialize();
      this.initialized = true;
    }
  }

  // Note CRUD operations
  async createNote(noteData = {}) {
    await this.initialize();
    
    const {
      title = 'Untitled',
      content = '',
      category_id = null,
      is_favorite = false,
      tags = []
    } = noteData;

    try {
      // Create the note
      const note = noteRepository.create({
        title,
        content,
        category_id,
        is_favorite
      });

      // Add tags if provided
      if (tags.length > 0) {
        tagRepository.setNoteTags(note.id, tags);
      }

      // Return note with tags
      return this.getNoteWithTags(note.id);
    } catch (error) {
      console.error('Error in createNote:', error);
      throw error;
    }
  }

  async getNoteById(id) {
    await this.initialize();
    
    try {
      return this.getNoteWithTags(id);
    } catch (error) {
      console.error('Error in getNoteById:', error);
      throw error;
    }
  }

  async getAllNotes() {
    await this.initialize();
    
    try {
      const notes = noteRepository.findAll();
      
      // Add tags to each note
      return Promise.all(
        notes.map(async (note) => {
          const tags = tagRepository.findByNote(note.id);
          return { ...note, tags };
        })
      );
    } catch (error) {
      console.error('Error in getAllNotes:', error);
      throw error;
    }
  }

  async updateNote(id, noteData) {
    await this.initialize();
    
    const { tags, ...noteFields } = noteData;

    try {
      // Update note fields
      const updatedNote = noteRepository.update(id, noteFields);
      
      // Update tags if provided
      if (tags !== undefined) {
        tagRepository.setNoteTags(id, tags);
      }

      return this.getNoteWithTags(id);
    } catch (error) {
      console.error('Error in updateNote:', error);
      throw error;
    }
  }

  async deleteNote(id) {
    await this.initialize();
    
    try {
      return noteRepository.delete(id);
    } catch (error) {
      console.error('Error in deleteNote:', error);
      throw error;
    }
  }

  async archiveNote(id) {
    await this.initialize();
    
    try {
      return noteRepository.archive(id);
    } catch (error) {
      console.error('Error in archiveNote:', error);
      throw error;
    }
  }

  async unarchiveNote(id) {
    await this.initialize();
    
    try {
      return noteRepository.unarchive(id);
    } catch (error) {
      console.error('Error in unarchiveNote:', error);
      throw error;
    }
  }

  async toggleFavorite(id) {
    await this.initialize();
    
    try {
      const note = noteRepository.findById(id);
      if (!note) {
        throw new Error('Note not found');
      }

      return noteRepository.update(id, {
        ...note,
        is_favorite: !note.is_favorite
      });
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      throw error;
    }
  }

  // Search and filtering
  async searchNotes(query) {
    await this.initialize();
    
    try {
      if (!query || query.trim() === '') {
        return this.getAllNotes();
      }

      const notes = noteRepository.search(query.trim());
      
      // Add tags to each note
      return Promise.all(
        notes.map(async (note) => {
          const tags = tagRepository.findByNote(note.id);
          return { ...note, tags };
        })
      );
    } catch (error) {
      console.error('Error in searchNotes:', error);
      throw error;
    }
  }

  async getNotesByCategory(categoryId) {
    await this.initialize();
    
    try {
      const notes = noteRepository.findByCategory(categoryId);
      
      // Add tags to each note
      return Promise.all(
        notes.map(async (note) => {
          const tags = tagRepository.findByNote(note.id);
          return { ...note, tags };
        })
      );
    } catch (error) {
      console.error('Error in getNotesByCategory:', error);
      throw error;
    }
  }

  async getFavoriteNotes() {
    await this.initialize();
    
    try {
      const notes = noteRepository.findFavorites();
      
      // Add tags to each note
      return Promise.all(
        notes.map(async (note) => {
          const tags = tagRepository.findByNote(note.id);
          return { ...note, tags };
        })
      );
    } catch (error) {
      console.error('Error in getFavoriteNotes:', error);
      throw error;
    }
  }

  async getRecentNotes(limit = 10) {
    await this.initialize();
    
    try {
      const notes = noteRepository.getRecentNotes(limit);
      
      // Add tags to each note
      return Promise.all(
        notes.map(async (note) => {
          const tags = tagRepository.findByNote(note.id);
          return { ...note, tags };
        })
      );
    } catch (error) {
      console.error('Error in getRecentNotes:', error);
      throw error;
    }
  }

  async getNotesByTag(tagId) {
    await this.initialize();
    
    try {
      const notes = tagRepository.findNotesWithTag(tagId);
      
      // Add tags to each note
      return Promise.all(
        notes.map(async (note) => {
          const tags = tagRepository.findByNote(note.id);
          return { ...note, tags };
        })
      );
    } catch (error) {
      console.error('Error in getNotesByTag:', error);
      throw error;
    }
  }

  // Helper methods
  async getNoteWithTags(id) {
    const note = noteRepository.findById(id);
    if (!note) return null;

    const tags = tagRepository.findByNote(id);
    return { ...note, tags };
  }

  // Statistics
  async getStats() {
    await this.initialize();
    
    try {
      const allNotes = noteRepository.findAll();
      const favoriteNotes = noteRepository.findFavorites();
      const categories = categoryRepository.findAll();
      const tags = tagRepository.findAll();

      return {
        totalNotes: allNotes.length,
        favoriteNotes: favoriteNotes.length,
        totalCategories: categories.length,
        totalTags: tags.length,
        recentNotes: allNotes.slice(0, 5)
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }
}

export default new NoteService();
