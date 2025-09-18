import { useState, useEffect, useRef, useCallback } from 'react';
import useNoteStore from '../../store/noteStore';
import markdownService from '../../services/markdownService';

const MarkdownEditor = () => {
  const textareaRef = useRef(null);
  const [localContent, setLocalContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const saveTimeoutRef = useRef(null);

  const {
    currentNote,
    updateCurrentNote,
    saveCurrentNote,
    updateNote
  } = useNoteStore();

  // Initialize content when note changes
  useEffect(() => {
    if (currentNote) {
      setLocalContent(currentNote.content || '');
      setIsDirty(false);
    }
  }, [currentNote?.id]);

  // Auto-save functionality
  const debouncedSave = useCallback(async () => {
    if (!currentNote || !isDirty) return;

    try {
      // Extract title from content
      const title = markdownService.extractTitle(localContent) || 'Untitled';
      
      await updateNote(currentNote.id, {
        title,
        content: localContent
      });
      
      setIsDirty(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [currentNote, localContent, isDirty, updateNote]);

  // Handle content changes
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    setIsDirty(true);

    // Update the store immediately for real-time updates
    updateCurrentNote({ content: newContent });

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new auto-save timeout (2 seconds)
    saveTimeoutRef.current = setTimeout(() => {
      debouncedSave();
    }, 2000);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          debouncedSave();
          break;
        case 'b':
          e.preventDefault();
          insertMarkdown('**', '**');
          break;
        case 'i':
          e.preventDefault();
          insertMarkdown('*', '*');
          break;
        case 'k':
          e.preventDefault();
          insertMarkdown('[', '](url)');
          break;
        default:
          break;
      }
    }

    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      
      if (e.shiftKey) {
        // Unindent
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const line = value.substring(lineStart, value.indexOf('\n', start));
        if (line.startsWith('  ')) {
          const newValue = value.substring(0, lineStart) + 
                          line.substring(2) + 
                          value.substring(lineStart + line.length);
          setLocalContent(newValue);
          setTimeout(() => {
            e.target.selectionStart = start - 2;
            e.target.selectionEnd = end - 2;
          }, 0);
        }
      } else {
        // Indent
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        setLocalContent(newValue);
        setTimeout(() => {
          e.target.selectionStart = start + 2;
          e.target.selectionEnd = end + 2;
        }, 0);
      }
    }
  };

  // Insert markdown formatting
  const insertMarkdown = (before, after) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localContent.substring(start, end);
    
    const newText = before + selectedText + after;
    const newContent = localContent.substring(0, start) + newText + localContent.substring(end);
    
    setLocalContent(newContent);
    setIsDirty(true);
    
    // Set cursor position
    setTimeout(() => {
      if (selectedText) {
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + selectedText.length;
      } else {
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length;
      }
      textarea.focus();
    }, 0);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!currentNote) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500">
        Select a note to start editing
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <h2 className="font-medium text-gray-900 truncate">
            {markdownService.extractTitle(localContent) || 'Untitled'}
          </h2>
          {isDirty && (
            <span className="w-2 h-2 bg-orange-400 rounded-full" title="Unsaved changes"></span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{markdownService.getWordCount(localContent)} words</span>
          <span>•</span>
          <span>{markdownService.getCharacterCount(localContent)} chars</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => insertMarkdown('**', '**')}
          className="p-2 hover:bg-gray-200 rounded text-sm font-bold"
          title="Bold (Cmd+B)"
        >
          B
        </button>
        <button
          onClick={() => insertMarkdown('*', '*')}
          className="p-2 hover:bg-gray-200 rounded text-sm italic"
          title="Italic (Cmd+I)"
        >
          I
        </button>
        <button
          onClick={() => insertMarkdown('`', '`')}
          className="p-2 hover:bg-gray-200 rounded text-sm font-mono"
          title="Code"
        >
          {'</>'}
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          onClick={() => insertMarkdown('# ', '')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
          title="Heading"
        >
          H1
        </button>
        <button
          onClick={() => insertMarkdown('- ', '')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
          title="List"
        >
          •
        </button>
        <button
          onClick={() => insertMarkdown('[', '](url)')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
          title="Link (Cmd+K)"
        >
          🔗
        </button>
        <button
          onClick={() => insertMarkdown('> ', '')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
          title="Quote"
        >
          "
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder="Start writing your note..."
          className="editor-textarea custom-scrollbar"
          spellCheck="true"
          autoFocus
        />
      </div>
    </div>
  );
};

export default MarkdownEditor;
