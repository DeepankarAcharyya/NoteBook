import noteService from './noteService.js';
import markdownService from './markdownService.js';

class ExportService {
  constructor() {
    this.supportedFormats = ['markdown', 'html', 'json', 'txt'];
  }

  // Export single note
  async exportNote(noteId, format = 'markdown') {
    try {
      const note = await noteService.getNoteById(noteId);
      if (!note) {
        throw new Error('Note not found');
      }

      switch (format.toLowerCase()) {
        case 'markdown':
          return this.exportAsMarkdown(note);
        case 'html':
          return await this.exportAsHTML(note);
        case 'json':
          return this.exportAsJSON(note);
        case 'txt':
          return this.exportAsText(note);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  // Export multiple notes
  async exportNotes(noteIds, format = 'markdown', options = {}) {
    try {
      const notes = await Promise.all(
        noteIds.map(id => noteService.getNoteById(id))
      );
      
      const validNotes = notes.filter(note => note !== null);

      switch (format.toLowerCase()) {
        case 'markdown':
          return this.exportMultipleAsMarkdown(validNotes, options);
        case 'html':
          return await this.exportMultipleAsHTML(validNotes, options);
        case 'json':
          return this.exportMultipleAsJSON(validNotes, options);
        case 'txt':
          return this.exportMultipleAsText(validNotes, options);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error('Bulk export failed:', error);
      throw error;
    }
  }

  // Export all notes
  async exportAllNotes(format = 'json', options = {}) {
    try {
      const notes = await noteService.getAllNotes();
      const noteIds = notes.map(note => note.id);
      return await this.exportNotes(noteIds, format, options);
    } catch (error) {
      console.error('Export all failed:', error);
      throw error;
    }
  }

  // Export as Markdown
  exportAsMarkdown(note) {
    let content = '';
    
    // Add frontmatter if requested
    content += '---\n';
    content += `title: "${note.title}"\n`;
    content += `created: ${note.created_at}\n`;
    content += `updated: ${note.updated_at}\n`;
    if (note.category_name) {
      content += `category: "${note.category_name}"\n`;
    }
    if (note.tags && note.tags.length > 0) {
      content += `tags: [${note.tags.map(tag => `"${tag.name}"`).join(', ')}]\n`;
    }
    content += `favorite: ${note.is_favorite}\n`;
    content += '---\n\n';
    
    // Add content
    content += note.content || '';
    
    return {
      content,
      filename: this.sanitizeFilename(`${note.title || 'Untitled'}.md`),
      mimeType: 'text/markdown'
    };
  }

  // Export as HTML
  async exportAsHTML(note) {
    const renderedContent = await markdownService.renderMarkdown(note.content || '');
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(note.title || 'Untitled')}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
        }
        .metadata {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            font-size: 0.9em;
        }
        .tags {
            margin-top: 0.5rem;
        }
        .tag {
            display: inline-block;
            background: #e3f2fd;
            color: #1976d2;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            margin-right: 0.5rem;
            font-size: 0.8em;
        }
        pre {
            background: #f8f8f8;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
        }
        code {
            background: #f0f0f0;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', monospace;
        }
        blockquote {
            border-left: 4px solid #ddd;
            margin: 1rem 0;
            padding-left: 1rem;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="metadata">
        <h1>${this.escapeHtml(note.title || 'Untitled')}</h1>
        <p><strong>Created:</strong> ${new Date(note.created_at).toLocaleString()}</p>
        <p><strong>Updated:</strong> ${new Date(note.updated_at).toLocaleString()}</p>
        ${note.category_name ? `<p><strong>Category:</strong> ${this.escapeHtml(note.category_name)}</p>` : ''}
        ${note.is_favorite ? '<p><strong>⭐ Favorite</strong></p>' : ''}
        ${note.tags && note.tags.length > 0 ? `
        <div class="tags">
            <strong>Tags:</strong>
            ${note.tags.map(tag => `<span class="tag">${this.escapeHtml(tag.name)}</span>`).join('')}
        </div>` : ''}
    </div>
    
    <div class="content">
        ${renderedContent}
    </div>
</body>
</html>`;

    return {
      content: html,
      filename: this.sanitizeFilename(`${note.title || 'Untitled'}.html`),
      mimeType: 'text/html'
    };
  }

  // Export as JSON
  exportAsJSON(note) {
    const exportData = {
      id: note.id,
      title: note.title,
      content: note.content,
      created_at: note.created_at,
      updated_at: note.updated_at,
      category: note.category_name ? {
        id: note.category_id,
        name: note.category_name,
        color: note.category_color
      } : null,
      tags: note.tags || [],
      is_favorite: note.is_favorite,
      metadata: {
        word_count: markdownService.getWordCount(note.content || ''),
        character_count: markdownService.getCharacterCount(note.content || ''),
        reading_time: markdownService.getReadingTime(note.content || ''),
        exported_at: new Date().toISOString(),
        export_version: '1.0'
      }
    };

    return {
      content: JSON.stringify(exportData, null, 2),
      filename: this.sanitizeFilename(`${note.title || 'Untitled'}.json`),
      mimeType: 'application/json'
    };
  }

  // Export as plain text
  exportAsText(note) {
    let content = `${note.title || 'Untitled'}\n`;
    content += '='.repeat((note.title || 'Untitled').length) + '\n\n';
    
    content += `Created: ${new Date(note.created_at).toLocaleString()}\n`;
    content += `Updated: ${new Date(note.updated_at).toLocaleString()}\n`;
    
    if (note.category_name) {
      content += `Category: ${note.category_name}\n`;
    }
    
    if (note.tags && note.tags.length > 0) {
      content += `Tags: ${note.tags.map(tag => tag.name).join(', ')}\n`;
    }
    
    if (note.is_favorite) {
      content += 'Favorite: Yes\n';
    }
    
    content += '\n' + '-'.repeat(50) + '\n\n';
    content += markdownService.extractPlainText(note.content || '');

    return {
      content,
      filename: this.sanitizeFilename(`${note.title || 'Untitled'}.txt`),
      mimeType: 'text/plain'
    };
  }

  // Export multiple notes as combined markdown
  exportMultipleAsMarkdown(notes, options = {}) {
    const { includeIndex = true, separateFiles = false } = options;
    
    if (separateFiles) {
      return notes.map(note => this.exportAsMarkdown(note));
    }

    let content = '';
    
    if (includeIndex) {
      content += '# Notes Export\n\n';
      content += `Exported on: ${new Date().toLocaleString()}\n`;
      content += `Total notes: ${notes.length}\n\n`;
      
      content += '## Table of Contents\n\n';
      notes.forEach((note, index) => {
        content += `${index + 1}. [${note.title || 'Untitled'}](#note-${index + 1})\n`;
      });
      content += '\n---\n\n';
    }

    notes.forEach((note, index) => {
      content += `## Note ${index + 1}\n\n`;
      content += `### ${note.title || 'Untitled'}\n\n`;
      content += `**Created:** ${new Date(note.created_at).toLocaleString()}  \n`;
      content += `**Updated:** ${new Date(note.updated_at).toLocaleString()}  \n`;
      
      if (note.category_name) {
        content += `**Category:** ${note.category_name}  \n`;
      }
      
      if (note.tags && note.tags.length > 0) {
        content += `**Tags:** ${note.tags.map(tag => tag.name).join(', ')}  \n`;
      }
      
      content += '\n';
      content += note.content || '';
      content += '\n\n---\n\n';
    });

    return {
      content,
      filename: `notes-export-${new Date().toISOString().split('T')[0]}.md`,
      mimeType: 'text/markdown'
    };
  }

  // Export multiple notes as JSON
  exportMultipleAsJSON(notes, options = {}) {
    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        total_notes: notes.length,
        export_version: '1.0',
        application: 'NoteBook'
      },
      notes: notes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        created_at: note.created_at,
        updated_at: note.updated_at,
        category: note.category_name ? {
          id: note.category_id,
          name: note.category_name,
          color: note.category_color
        } : null,
        tags: note.tags || [],
        is_favorite: note.is_favorite,
        metadata: {
          word_count: markdownService.getWordCount(note.content || ''),
          character_count: markdownService.getCharacterCount(note.content || ''),
          reading_time: markdownService.getReadingTime(note.content || '')
        }
      }))
    };

    return {
      content: JSON.stringify(exportData, null, 2),
      filename: `notes-export-${new Date().toISOString().split('T')[0]}.json`,
      mimeType: 'application/json'
    };
  }

  // Export multiple notes as HTML
  async exportMultipleAsHTML(notes, options = {}) {
    const renderedNotes = await Promise.all(
      notes.map(async note => ({
        ...note,
        renderedContent: await markdownService.renderMarkdown(note.content || '')
      }))
    );

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notes Export</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
        }
        .export-header {
            text-align: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 2px solid #eee;
        }
        .note {
            margin-bottom: 3rem;
            padding: 2rem;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: #fafafa;
        }
        .note-header {
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #ddd;
        }
        .note-title {
            margin: 0 0 0.5rem 0;
            color: #2c3e50;
        }
        .note-meta {
            font-size: 0.9em;
            color: #666;
        }
        .tag {
            display: inline-block;
            background: #e3f2fd;
            color: #1976d2;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            margin-right: 0.5rem;
            font-size: 0.8em;
        }
        pre {
            background: #f8f8f8;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
        }
        code {
            background: #f0f0f0;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', monospace;
        }
        blockquote {
            border-left: 4px solid #ddd;
            margin: 1rem 0;
            padding-left: 1rem;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="export-header">
        <h1>Notes Export</h1>
        <p>Exported on: ${new Date().toLocaleString()}</p>
        <p>Total notes: ${notes.length}</p>
    </div>
    
    ${renderedNotes.map((note, index) => `
    <div class="note">
        <div class="note-header">
            <h2 class="note-title">${this.escapeHtml(note.title || 'Untitled')}</h2>
            <div class="note-meta">
                <p><strong>Created:</strong> ${new Date(note.created_at).toLocaleString()}</p>
                <p><strong>Updated:</strong> ${new Date(note.updated_at).toLocaleString()}</p>
                ${note.category_name ? `<p><strong>Category:</strong> ${this.escapeHtml(note.category_name)}</p>` : ''}
                ${note.is_favorite ? '<p><strong>⭐ Favorite</strong></p>' : ''}
                ${note.tags && note.tags.length > 0 ? `
                <div>
                    <strong>Tags:</strong>
                    ${note.tags.map(tag => `<span class="tag">${this.escapeHtml(tag.name)}</span>`).join('')}
                </div>` : ''}
            </div>
        </div>
        <div class="note-content">
            ${note.renderedContent}
        </div>
    </div>
    `).join('')}
</body>
</html>`;

    return {
      content: html,
      filename: `notes-export-${new Date().toISOString().split('T')[0]}.html`,
      mimeType: 'text/html'
    };
  }

  // Export multiple notes as text
  exportMultipleAsText(notes, options = {}) {
    let content = 'NOTES EXPORT\n';
    content += '='.repeat(50) + '\n\n';
    content += `Exported on: ${new Date().toLocaleString()}\n`;
    content += `Total notes: ${notes.length}\n\n`;
    content += '='.repeat(50) + '\n\n';

    notes.forEach((note, index) => {
      content += `NOTE ${index + 1}: ${note.title || 'Untitled'}\n`;
      content += '-'.repeat(50) + '\n';
      content += `Created: ${new Date(note.created_at).toLocaleString()}\n`;
      content += `Updated: ${new Date(note.updated_at).toLocaleString()}\n`;
      
      if (note.category_name) {
        content += `Category: ${note.category_name}\n`;
      }
      
      if (note.tags && note.tags.length > 0) {
        content += `Tags: ${note.tags.map(tag => tag.name).join(', ')}\n`;
      }
      
      if (note.is_favorite) {
        content += 'Favorite: Yes\n';
      }
      
      content += '\n';
      content += markdownService.extractPlainText(note.content || '');
      content += '\n\n' + '='.repeat(50) + '\n\n';
    });

    return {
      content,
      filename: `notes-export-${new Date().toISOString().split('T')[0]}.txt`,
      mimeType: 'text/plain'
    };
  }

  // Utility functions
  sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Get supported formats
  getSupportedFormats() {
    return this.supportedFormats;
  }
}

export default new ExportService();
