import { useState, useEffect, useMemo } from 'react';
import useNoteStore from '../../store/noteStore';
import markdownService from '../../services/markdownService';

const Preview = () => {
  const [renderedContent, setRenderedContent] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);

  const { currentNote } = useNoteStore();

  // Memoize the content to avoid unnecessary re-renders
  const content = useMemo(() => {
    return currentNote?.content || '';
  }, [currentNote?.content]);

  // Render markdown content
  useEffect(() => {
    const renderMarkdown = async () => {
      if (!content.trim()) {
        setRenderedContent('');
        return;
      }

      setIsRendering(true);
      setRenderError(null);

      try {
        const html = await markdownService.renderMarkdown(content);
        setRenderedContent(html);
      } catch (error) {
        console.error('Failed to render markdown:', error);
        setRenderError(error.message);
        // Fallback to escaped HTML
        setRenderedContent(markdownService.escapeHtml(content));
      } finally {
        setIsRendering(false);
      }
    };

    // Debounce rendering for performance
    const timeoutId = setTimeout(renderMarkdown, 300);
    return () => clearTimeout(timeoutId);
  }, [content]);

  // Generate table of contents
  const tableOfContents = useMemo(() => {
    if (!content) return [];
    return markdownService.generateTOC(content);
  }, [content]);

  if (!currentNote) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500">
        Select a note to see preview
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Preview Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <h2 className="font-medium text-gray-900">Preview</h2>
          {isRendering && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{markdownService.getReadingTime(content)} min read</span>
          {tableOfContents.length > 0 && (
            <>
              <span>•</span>
              <span>{tableOfContents.length} headings</span>
            </>
          )}
        </div>
      </div>

      {/* Table of Contents (if headings exist) */}
      {tableOfContents.length > 0 && (
        <div className="border-b border-gray-200 bg-gray-50">
          <details className="group">
            <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 select-none">
              Table of Contents
              <span className="float-right group-open:rotate-90 transition-transform">▶</span>
            </summary>
            <div className="px-3 pb-3 max-h-40 overflow-y-auto custom-scrollbar">
              <ul className="space-y-1">
                {tableOfContents.map((heading, index) => (
                  <li key={index}>
                    <a
                      href={`#${heading.id}`}
                      className={`block text-sm text-gray-600 hover:text-blue-600 transition-colors ${
                        heading.level > 1 ? `ml-${(heading.level - 1) * 3}` : ''
                      }`}
                      style={{ marginLeft: `${(heading.level - 1) * 12}px` }}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      )}

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {renderError ? (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-medium mb-2">Rendering Error</h3>
              <p className="text-red-600 text-sm mb-3">{renderError}</p>
              <details>
                <summary className="text-red-700 text-sm cursor-pointer">Show raw content</summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                  {content}
                </pre>
              </details>
            </div>
          </div>
        ) : content.trim() ? (
          <div 
            className="preview-container"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📝</div>
              <p>Start writing to see preview</p>
            </div>
          </div>
        )}
      </div>

      {/* Preview Footer */}
      {content && (
        <div className="border-t border-gray-200 bg-gray-50 px-3 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span>Words: {markdownService.getWordCount(content)}</span>
              <span>Characters: {markdownService.getCharacterCount(content)}</span>
            </div>
            <div className="flex items-center gap-3">
              {currentNote.category_name && (
                <span className="flex items-center gap-1">
                  📁 {currentNote.category_name}
                </span>
              )}
              {currentNote.is_favorite && (
                <span>❤️ Favorite</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Preview;
