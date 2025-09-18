import dbConnection from './connection.js';

class CategoryRepository {
  constructor() {
    this.db = null;
  }

  initialize() {
    this.db = dbConnection.getDatabase();
  }

  findAll() {
    try {
      return this.db.findAllCategories();
    } catch (error) {
      console.error('Error finding all categories:', error);
      throw error;
    }
  }

  findById(id) {
    try {
      const categories = this.db.findAllCategories();
      return categories.find(c => c.id === id);
    } catch (error) {
      console.error('Error finding category by id:', error);
      throw error;
    }
  }

  // Simplified methods for localStorage implementation
  create(categoryData) {
    // For now, return a basic implementation
    console.log('Category creation not implemented in localStorage version');
    return null;
  }

  update(id, categoryData) {
    console.log('Category update not implemented in localStorage version');
    return null;
  }

  delete(id) {
    console.log('Category deletion not implemented in localStorage version');
    return false;
  }

  getHierarchy() {
    try {
      const categories = this.findAll();
      return categories.filter(c => c.parent_id === null);
    } catch (error) {
      console.error('Error getting category hierarchy:', error);
      throw error;
    }
  }

  getNoteCount(id) {
    try {
      const notes = this.db.findAllNotes();
      return notes.filter(note => note.category_id === id).length;
    } catch (error) {
      console.error('Error getting note count for category:', error);
      throw error;
    }
  }
}

export default new CategoryRepository();
