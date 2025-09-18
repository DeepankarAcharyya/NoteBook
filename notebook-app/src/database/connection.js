// Temporary fallback to localStorage for development
// This will be replaced with SQLite once native modules are properly configured
import localStorageDb from './localStorageConnection.js';

class DatabaseConnection {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize(dbPath = 'notebook.db') {
    try {
      // Use localStorage database for now
      this.db = await localStorageDb.initialize();
      this.isInitialized = true;
      console.log('Database initialized successfully (using localStorage)');
      return this.db;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  getDatabase() {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.isInitialized = false;
      console.log('Database connection closed');
    }
  }

  // Transaction helper
  transaction(fn) {
    const db = this.getDatabase();
    return db.transaction(fn);
  }

  // Backup database
  backup() {
    const db = this.getDatabase();
    return db.backup();
  }
}

// Singleton instance
const dbConnection = new DatabaseConnection();

export default dbConnection;
