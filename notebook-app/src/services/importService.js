import noteService from './noteService.js';
import markdownService from './markdownService.js';

class ImportService {
  constructor() {
    this.supportedFormats = ['markdown', 'md', 'txt', 'json'];
  }

  // Import single file
  async importFile(file, options = {}) {
    try {
      const {
        categoryId = null,
        addToFavorites = false,
        preserveMetadata = true,
        conflictResolution = 'rename' // 'rename', 'overwrite', 'skip'
      } = options;

      const content = await this.readFile(file);
      const extension = this.getFileExtension(file.name);

      switch (extension) {
        case 'md':
        case 'markdown':
          return await this.importMarkdown(content, file.name, {
            categoryId,
            addToFavorites,
            preserveMetadata
          });
        
        case 'txt':
          return await this.importText(content, file.name, {
            categoryId,
            addToFavorites
          });
        
        case 'json':
          return await this.importJSON(content, {
            categoryId,
            addToFavorites,
            preserveMetadata,
            conflictResolution
          });
        
        default:
          throw new Error(`Unsupported file format: ${extension}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  // Import multiple files
  async importFiles(files, options = {}) {
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    for (const file of files) {
      try {
        const result = await this.importFile(file, options);
        results.successful.push({
          filename: file.name,
          noteId: result.id,
          title: result.title
        });
      } catch (error) {
        results.failed.push({
          filename: file.name,
          error: error.message
        });
      }
    }

    return results;
  }

  // Import from markdown file
  async importMarkdown(content, filename, options = {}) {
    const { categoryId, addToFavorites, preserveMetadata } = options;

    // Parse frontmatter if present
    const frontmatter = markdownService.extractFrontmatter(content);
    const markdownContent = markdownService.removeFrontmatter(content);

    // Extract title
    let title = frontmatter.title || markdownService.extractTitle(markdownContent);
    if (!title || title === 'Untitled') {
      title = this.getFilenameWithoutExtension(filename);
    }

    // Prepare note data
    const noteData = {
      title,
      content: markdownContent,
      category_id: categoryId,
      is_favorite: addToFavorites || (preserveMetadata && frontmatter.favorite === 'true')
    };

    // Handle metadata if preserving
    if (preserveMetadata) {
      if (frontmatter.created) {
        noteData.created_at = new Date(frontmatter.created).toISOString();
      }
      if (frontmatter.updated) {
        noteData.updated_at = new Date(frontmatter.updated).toISOString();
      }
    }

    // Create note
    const note = await noteService.createNote(noteData);

    // Handle tags if present
    if (preserveMetadata && frontmatter.tags) {
      try {
        const tags = this.parseTags(frontmatter.tags);
        // Note: Tag functionality would be implemented here when tags are fully supported
        console.log('Tags found but not yet implemented:', tags);
      } catch (error) {
        console.warn('Failed to parse tags:', error);
      }
    }

    return note;
  }

  // Import from text file
  async importText(content, filename, options = {}) {
    const { categoryId, addToFavorites } = options;

    const title = this.getFilenameWithoutExtension(filename);
    
    const noteData = {
      title,
      content,
      category_id: categoryId,
      is_favorite: addToFavorites
    };

    return await noteService.createNote(noteData);
  }

  // Import from JSON file
  async importJSON(content, options = {}) {
    const { categoryId, addToFavorites, preserveMetadata, conflictResolution } = options;

    let data;
    try {
      data = JSON.parse(content);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    // Handle different JSON structures
    if (data.notes && Array.isArray(data.notes)) {
      // Bulk export format
      return await this.importBulkJSON(data, options);
    } else if (data.id || data.title || data.content) {
      // Single note format
      return await this.importSingleNoteJSON(data, options);
    } else {
      throw new Error('Unrecognized JSON structure');
    }
  }

  // Import single note from JSON
  async importSingleNoteJSON(data, options = {}) {
    const { categoryId, addToFavorites, preserveMetadata } = options;

    const noteData = {
      title: data.title || 'Imported Note',
      content: data.content || '',
      category_id: categoryId,
      is_favorite: addToFavorites || (preserveMetadata && data.is_favorite)
    };

    // Preserve timestamps if requested
    if (preserveMetadata) {
      if (data.created_at) {
        noteData.created_at = data.created_at;
      }
      if (data.updated_at) {
        noteData.updated_at = data.updated_at;
      }
    }

    return await noteService.createNote(noteData);
  }

  // Import multiple notes from JSON
  async importBulkJSON(data, options = {}) {
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    for (const noteData of data.notes) {
      try {
        const note = await this.importSingleNoteJSON(noteData, options);
        results.successful.push({
          originalId: noteData.id,
          newId: note.id,
          title: note.title
        });
      } catch (error) {
        results.failed.push({
          originalId: noteData.id,
          title: noteData.title,
          error: error.message
        });
      }
    }

    return results;
  }

  // Import from Notion export
  async importNotionExport(zipFile) {
    // This would handle Notion's CSV + markdown files export
    // For now, return a placeholder
    throw new Error('Notion import not yet implemented');
  }

  // Import from Obsidian vault
  async importObsidianVault(files) {
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    // Filter markdown files
    const markdownFiles = files.filter(file => 
      file.name.endsWith('.md') && !file.name.startsWith('.')
    );

    for (const file of markdownFiles) {
      try {
        const result = await this.importFile(file, {
          preserveMetadata: true,
          addToFavorites: false
        });
        
        results.successful.push({
          filename: file.name,
          noteId: result.id,
          title: result.title
        });
      } catch (error) {
        results.failed.push({
          filename: file.name,
          error: error.message
        });
      }
    }

    return results;
  }

  // Import from Bear export
  async importBearExport(files) {
    // Bear exports as individual markdown files
    return await this.importObsidianVault(files);
  }

  // Utility functions
  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  getFilenameWithoutExtension(filename) {
    return filename.replace(/\.[^/.]+$/, '');
  }

  parseTags(tagsString) {
    if (Array.isArray(tagsString)) {
      return tagsString;
    }
    
    if (typeof tagsString === 'string') {
      // Handle different tag formats
      if (tagsString.startsWith('[') && tagsString.endsWith(']')) {
        // JSON array format: ["tag1", "tag2"]
        return JSON.parse(tagsString);
      } else {
        // Comma-separated format: "tag1, tag2, tag3"
        return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    }
    
    return [];
  }

  // Validate import data
  validateImportData(data, format) {
    switch (format) {
      case 'json':
        if (typeof data !== 'object') {
          throw new Error('Invalid JSON data');
        }
        break;
      
      case 'markdown':
      case 'txt':
        if (typeof data !== 'string') {
          throw new Error('Invalid text data');
        }
        break;
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    return true;
  }

  // Get import statistics
  getImportStats(results) {
    const total = results.successful.length + results.failed.length + results.skipped.length;
    
    return {
      total,
      successful: results.successful.length,
      failed: results.failed.length,
      skipped: results.skipped.length,
      successRate: total > 0 ? (results.successful.length / total * 100).toFixed(1) : 0
    };
  }

  // Preview import (without actually importing)
  async previewImport(file) {
    try {
      const content = await this.readFile(file);
      const extension = this.getFileExtension(file.name);

      switch (extension) {
        case 'md':
        case 'markdown':
          return this.previewMarkdown(content, file.name);
        
        case 'txt':
          return this.previewText(content, file.name);
        
        case 'json':
          return this.previewJSON(content);
        
        default:
          throw new Error(`Unsupported file format: ${extension}`);
      }
    } catch (error) {
      throw new Error(`Preview failed: ${error.message}`);
    }
  }

  previewMarkdown(content, filename) {
    const frontmatter = markdownService.extractFrontmatter(content);
    const markdownContent = markdownService.removeFrontmatter(content);
    const title = frontmatter.title || markdownService.extractTitle(markdownContent) || this.getFilenameWithoutExtension(filename);

    return {
      title,
      contentPreview: markdownContent.substring(0, 200) + (markdownContent.length > 200 ? '...' : ''),
      wordCount: markdownService.getWordCount(markdownContent),
      hasMetadata: Object.keys(frontmatter).length > 0,
      metadata: frontmatter,
      estimatedReadingTime: markdownService.getReadingTime(markdownContent)
    };
  }

  previewText(content, filename) {
    const title = this.getFilenameWithoutExtension(filename);
    
    return {
      title,
      contentPreview: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
      hasMetadata: false,
      metadata: {},
      estimatedReadingTime: Math.ceil(content.split(/\s+/).length / 200)
    };
  }

  previewJSON(content) {
    const data = JSON.parse(content);
    
    if (data.notes && Array.isArray(data.notes)) {
      return {
        type: 'bulk',
        noteCount: data.notes.length,
        exportInfo: data.export_info || {},
        sampleTitles: data.notes.slice(0, 5).map(note => note.title || 'Untitled')
      };
    } else {
      return {
        type: 'single',
        title: data.title || 'Untitled',
        hasContent: !!data.content,
        contentLength: data.content ? data.content.length : 0,
        metadata: {
          created_at: data.created_at,
          updated_at: data.updated_at,
          is_favorite: data.is_favorite,
          category: data.category,
          tags: data.tags
        }
      };
    }
  }

  // Get supported formats
  getSupportedFormats() {
    return this.supportedFormats;
  }
}

export default new ImportService();
