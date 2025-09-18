import dbConnection from './connection.js';

class NoteRepository {
  constructor() {
    this.db = null;
  }

  initialize() {
    this.db = dbConnection.getDatabase();
  }

  create(noteData) {
    try {
      return this.db.createNote(noteData);
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  findById(id) {
    try {
      return this.db.findNoteById(id);
    } catch (error) {
      console.error('Error finding note by id:', error);
      throw error;
    }
  }

  findAll() {
    try {
      return this.db.findAllNotes();
    } catch (error) {
      console.error('Error finding all notes:', error);
      throw error;
    }
  }

  update(id, noteData) {
    try {
      return this.db.updateNote(id, noteData);
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  delete(id) {
    try {
      return this.db.deleteNote(id);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  archive(id) {
    try {
      return this.db.updateNote(id, { is_archived: true });
    } catch (error) {
      console.error('Error archiving note:', error);
      throw error;
    }
  }

  unarchive(id) {
    try {
      return this.db.updateNote(id, { is_archived: false });
    } catch (error) {
      console.error('Error unarchiving note:', error);
      throw error;
    }
  }

  findByCategory(categoryId) {
    try {
      return this.db.findAllNotes().filter(note => note.category_id === categoryId);
    } catch (error) {
      console.error('Error finding notes by category:', error);
      throw error;
    }
  }

  findFavorites() {
    try {
      return this.db.findFavoriteNotes();
    } catch (error) {
      console.error('Error finding favorite notes:', error);
      throw error;
    }
  }

  search(query) {
    try {
      return this.db.searchNotes(query);
    } catch (error) {
      console.error('Error searching notes:', error);
      throw error;
    }
  }

  getRecentNotes(limit = 10) {
    try {
      return this.db.findRecentNotes(limit);
    } catch (error) {
      console.error('Error getting recent notes:', error);
      throw error;
    }
  }

  // Get notes with their tags
  findWithTags(id) {
    try {
      const note = this.findById(id);
      if (!note) return null;

      const tags = this.db.findTagsByNote(id);
      return { ...note, tags };
    } catch (error) {
      console.error('Error finding note with tags:', error);
      throw error;
    }
  }
}

export default new NoteRepository();
