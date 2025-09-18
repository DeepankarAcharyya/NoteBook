# NoteBook - Markdown Note-Taking App Design Document

## Overview

A modern, desktop note-taking application with markdown support and local database storage. Built for developers and power users who need a fast, reliable, and feature-rich note management system.

## Tech Stack

### Core Technologies
- **Frontend Framework**: React 18 with Vite
- **Desktop Framework**: Electron
- **Database**: SQLite with better-sqlite3
- **Markdown Processing**: unified.js ecosystem (remark/rehype)
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: Zustand
- **Search Engine**: SQLite FTS5 (Full-Text Search)
- **Build Tool**: Vite + Electron Builder

### Development Tools
- **Language**: JavaScript (with optional TypeScript migration path)
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest + React Testing Library
- **Package Manager**: npm/yarn

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │    Business     │    │      Data       │
│      Layer      │◄──►│     Logic       │◄──►│     Layer       │
│                 │    │     Layer       │    │                 │
│ React Components│    │   Services      │    │ SQLite Database │
│ Zustand Stores  │    │ Repositories    │    │ File System     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Module Structure
```
src/
├── components/          # React UI components
│   ├── Editor/         # Markdown editor components
│   ├── Sidebar/        # Navigation and organization
│   ├── Layout/         # App layout components
│   └── Common/         # Reusable UI components
├── services/           # Business logic layer
├── database/           # Data access layer
├── store/              # State management
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions (if used)
└── assets/             # Static assets
```

## Database Design

### Schema Overview
```sql
-- Core notes table
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    category_id INTEGER,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Full-text search virtual table
CREATE VIRTUAL TABLE notes_fts USING fts5(
    title, content, content='notes', content_rowid='id'
);

-- Categories for hierarchical organization
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6B7280',
    parent_id INTEGER,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Tags for flexible labeling
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#3B82F6'
);

-- Many-to-many relationship: notes ↔ tags
CREATE TABLE note_tags (
    note_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Application settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

### Indexes for Performance
```sql
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_notes_category ON notes(category_id);
CREATE INDEX idx_notes_favorite ON notes(is_favorite);
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

## Core Features

### 1. Markdown Editor
- **Live Preview**: Split-pane editor with real-time markdown rendering
- **Syntax Highlighting**: Code blocks with language-specific highlighting
- **Math Support**: LaTeX math rendering with KaTeX
- **Table Editing**: Enhanced table creation and editing
- **Auto-completion**: Smart completion for markdown syntax
- **Vim/Emacs Keybindings**: Optional editor modes

### 2. Note Organization
- **Categories**: Hierarchical folder-like organization
- **Tags**: Flexible labeling system with colors
- **Favorites**: Quick access to important notes
- **Archive**: Hide completed/old notes without deletion
- **Search**: Full-text search across all content

### 3. Search & Discovery
- **Full-Text Search**: SQLite FTS5 with ranking
- **Filter Combinations**: Search + category + tags
- **Recent Notes**: Quick access to recently edited
- **Search History**: Remember previous searches
- **Fuzzy Matching**: Typo-tolerant search

### 4. Import/Export
- **Export Formats**: Markdown, HTML, PDF, JSON
- **Import Sources**: 
  - Individual markdown files
  - Notion exports
  - Obsidian vaults
  - Bear exports
- **Batch Operations**: Bulk import/export with progress tracking

## Technical Implementation Details

### Markdown Processing Pipeline
```javascript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

const processor = unified()
  .use(remarkParse)           // Parse markdown AST
  .use(remarkGfm)             // GitHub Flavored Markdown
  .use(remarkMath)            // Math notation support
  .use(remarkRehype)          // Convert to HTML AST
  .use(rehypeKatex)           // Render math expressions
  .use(rehypeHighlight)       // Syntax highlighting
  .use(rehypeStringify);      // Convert to HTML string
```

### State Management Architecture
```javascript
// Zustand stores with persistence
const useNoteStore = create(
  persist(
    (set, get) => ({
      notes: [],
      currentNote: null,
      searchQuery: '',
      selectedCategory: null,
      selectedTags: [],
      // Actions
      createNote: (note) => set(state => ({ 
        notes: [...state.notes, note] 
      })),
      updateNote: (id, updates) => set(state => ({
        notes: state.notes.map(note => 
          note.id === id ? { ...note, ...updates } : note
        )
      })),
      deleteNote: (id) => set(state => ({
        notes: state.notes.filter(note => note.id !== id)
      })),
    }),
    { name: 'note-store' }
  )
);
```

### Performance Optimizations
1. **Virtual Scrolling**: Handle large note lists efficiently
2. **Debounced Operations**: 
   - Auto-save: 2 seconds after last edit
   - Search: 300ms after last keystroke
3. **Memoization**: React.memo for expensive components
4. **Lazy Loading**: Load note content on demand
5. **Web Workers**: Heavy operations (search indexing, export)

### Auto-save Strategy
```javascript
const useAutoSave = (noteId, content) => {
  const debouncedSave = useMemo(
    () => debounce((id, content) => {
      noteService.updateNote(id, { content, updated_at: new Date() });
    }, 2000),
    []
  );

  useEffect(() => {
    if (noteId && content) {
      debouncedSave(noteId, content);
    }
  }, [noteId, content, debouncedSave]);
};
```

## Security & Data Integrity

### Data Protection
- **Input Sanitization**: Prevent XSS in markdown content
- **Database Transactions**: Ensure data consistency
- **Backup System**: Automatic daily backups
- **Data Validation**: Schema validation at service layer
- **Error Boundaries**: Graceful error handling

### File System Security
- **Sandboxed Access**: Electron security best practices
- **Path Validation**: Prevent directory traversal
- **File Type Validation**: Restrict import file types

## User Experience Design

### Interface Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Header: App Title | Search Bar | Settings | Export          │
├─────────────┬───────────────────────────┬───────────────────┤
│ Sidebar     │ Editor Pane               │ Preview Pane      │
│             │                           │                   │
│ Categories  │ # Note Title              │ Rendered HTML     │
│ ├─ Work     │                           │                   │
│ ├─ Personal │ Markdown content here...  │ Live preview of   │
│ └─ Archive  │                           │ the markdown      │
│             │                           │                   │
│ Tags        │                           │                   │
│ #important  │                           │                   │
│ #todo       │                           │                   │
│             │                           │                   │
│ Recent      │                           │                   │
│ • Note 1    │                           │                   │
│ • Note 2    │                           │                   │
└─────────────┴───────────────────────────┴───────────────────┤
│ Status Bar: Word count | Save status | Cursor position     │
└─────────────────────────────────────────────────────────────┘
```

### Keyboard Shortcuts
- `Ctrl/Cmd + N`: New note
- `Ctrl/Cmd + S`: Save note
- `Ctrl/Cmd + F`: Search
- `Ctrl/Cmd + E`: Toggle preview
- `Ctrl/Cmd + B`: Bold text
- `Ctrl/Cmd + I`: Italic text
- `Ctrl/Cmd + K`: Insert link

## Development Roadmap

### Phase 1: Core Functionality (MVP)
- [ ] Basic note CRUD operations
- [ ] Simple markdown editor
- [ ] SQLite database setup
- [ ] Basic search functionality

### Phase 2: Enhanced Features
- [ ] Categories and tags
- [ ] Live preview
- [ ] Auto-save
- [ ] Import/export basic formats

### Phase 3: Advanced Features
- [ ] Full-text search with FTS5
- [ ] Math and code highlighting
- [ ] Advanced import/export
- [ ] Backup and sync options

### Phase 4: Polish & Performance
- [ ] Performance optimizations
- [ ] UI/UX improvements
- [ ] Comprehensive testing
- [ ] Documentation

## Testing Strategy

### Unit Tests
- Database operations
- Markdown processing
- Search functionality
- Import/export logic

### Integration Tests
- Component interactions
- Database transactions
- File system operations

### End-to-End Tests
- Complete user workflows
- Cross-platform compatibility
- Performance benchmarks

## Deployment & Distribution

### Build Process
1. **Development**: `npm run dev` (Vite + Electron)
2. **Testing**: `npm run test` (Jest + Testing Library)
3. **Building**: `npm run build` (Production build)
4. **Packaging**: `npm run dist` (Electron Builder)

### Distribution Targets
- **Windows**: NSIS installer (.exe)
- **macOS**: DMG package (.dmg)
- **Linux**: AppImage (.appimage)

### Auto-Updates
- Electron auto-updater integration
- Semantic versioning
- Release notes and changelog

---

*This design document serves as the blueprint for the NoteBook application. It will be updated as the project evolves and new requirements emerge.*
