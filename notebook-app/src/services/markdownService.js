import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

class MarkdownService {
  constructor() {
    this.processor = null;
    this.initializeProcessor();
  }

  initializeProcessor() {
    this.processor = unified()
      .use(remarkParse)           // Parse markdown AST
      .use(remarkGfm)             // GitHub Flavored Markdown
      .use(remarkMath)            // Math notation support
      .use(remarkRehype, {        // Convert to HTML AST
        allowDangerousHtml: false  // Security: don't allow raw HTML
      })
      .use(rehypeKatex)           // Render math expressions
      .use(rehypeHighlight, {     // Syntax highlighting
        detect: true,             // Auto-detect language
        ignoreMissing: true       // Don't throw on unknown languages
      })
      .use(rehypeStringify);      // Convert to HTML string
  }

  async renderMarkdown(markdown) {
    try {
      if (!markdown || typeof markdown !== 'string') {
        return '';
      }

      const result = await this.processor.process(markdown);
      return String(result);
    } catch (error) {
      console.error('Error rendering markdown:', error);
      // Return escaped HTML as fallback
      return this.escapeHtml(markdown);
    }
  }

  // Synchronous version for performance-critical operations
  renderMarkdownSync(markdown) {
    try {
      if (!markdown || typeof markdown !== 'string') {
        return '';
      }

      const result = this.processor.processSync(markdown);
      return String(result);
    } catch (error) {
      console.error('Error rendering markdown sync:', error);
      return this.escapeHtml(markdown);
    }
  }

  // Extract plain text from markdown (for search indexing)
  extractPlainText(markdown) {
    try {
      if (!markdown || typeof markdown !== 'string') {
        return '';
      }

      // Simple regex-based approach for extracting text
      return markdown
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]*`/g, '')
        // Remove links but keep text
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        // Remove images
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        // Remove headers
        .replace(/^#{1,6}\s+/gm, '')
        // Remove emphasis
        .replace(/[*_]{1,2}([^*_]*)[*_]{1,2}/g, '$1')
        // Remove strikethrough
        .replace(/~~([^~]*)~~/g, '$1')
        // Remove horizontal rules
        .replace(/^---+$/gm, '')
        // Remove list markers
        .replace(/^[\s]*[-*+]\s+/gm, '')
        .replace(/^[\s]*\d+\.\s+/gm, '')
        // Clean up whitespace
        .replace(/\n\s*\n/g, '\n')
        .trim();
    } catch (error) {
      console.error('Error extracting plain text:', error);
      return markdown;
    }
  }

  // Extract title from markdown content
  extractTitle(markdown) {
    try {
      if (!markdown || typeof markdown !== 'string') {
        return 'Untitled';
      }

      // Look for first heading
      const headingMatch = markdown.match(/^#{1,6}\s+(.+)$/m);
      if (headingMatch) {
        return headingMatch[1].trim();
      }

      // Look for first non-empty line
      const lines = markdown.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
          // Limit title length and remove markdown formatting
          return this.extractPlainText(trimmed).substring(0, 100);
        }
      }

      return 'Untitled';
    } catch (error) {
      console.error('Error extracting title:', error);
      return 'Untitled';
    }
  }

  // Get word count from markdown
  getWordCount(markdown) {
    try {
      const plainText = this.extractPlainText(markdown);
      if (!plainText) return 0;
      
      return plainText
        .split(/\s+/)
        .filter(word => word.length > 0)
        .length;
    } catch (error) {
      console.error('Error getting word count:', error);
      return 0;
    }
  }

  // Get character count (excluding markdown syntax)
  getCharacterCount(markdown) {
    try {
      const plainText = this.extractPlainText(markdown);
      return plainText.length;
    } catch (error) {
      console.error('Error getting character count:', error);
      return 0;
    }
  }

  // Get reading time estimate (average 200 words per minute)
  getReadingTime(markdown) {
    try {
      const wordCount = this.getWordCount(markdown);
      const minutes = Math.ceil(wordCount / 200);
      return minutes;
    } catch (error) {
      console.error('Error getting reading time:', error);
      return 0;
    }
  }

  // Validate markdown syntax
  validateMarkdown(markdown) {
    try {
      this.processor.processSync(markdown);
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }

  // Extract metadata from markdown frontmatter
  extractFrontmatter(markdown) {
    try {
      const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        return {};
      }

      const frontmatter = frontmatterMatch[1];
      const metadata = {};

      // Simple YAML-like parsing
      const lines = frontmatter.split('\n');
      for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          const [, key, value] = match;
          metadata[key] = value.trim().replace(/^["']|["']$/g, '');
        }
      }

      return metadata;
    } catch (error) {
      console.error('Error extracting frontmatter:', error);
      return {};
    }
  }

  // Remove frontmatter from markdown content
  removeFrontmatter(markdown) {
    try {
      return markdown.replace(/^---\n[\s\S]*?\n---\n?/, '');
    } catch (error) {
      console.error('Error removing frontmatter:', error);
      return markdown;
    }
  }

  // Escape HTML for security
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Generate table of contents
  generateTOC(markdown) {
    try {
      const headings = [];
      const lines = markdown.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2].trim();
          const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
          
          headings.push({
            level,
            text,
            id,
            line: i + 1
          });
        }
      }

      return headings;
    } catch (error) {
      console.error('Error generating TOC:', error);
      return [];
    }
  }
}

export default new MarkdownService();
