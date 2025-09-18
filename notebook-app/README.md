# 📝 NoteBook - Advanced Markdown Note-Taking App

A modern, feature-rich markdown note-taking application built with React, Electron, and containerized with Docker. Perfect for developers, writers, and anyone who loves markdown.

![NoteBook App](https://img.shields.io/badge/React-18-blue) ![Electron](https://img.shields.io/badge/Electron-Latest-green) ![Docker](https://img.shields.io/badge/Docker-Ready-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 📝 Core Note-Taking
- **Live Markdown Editor** with syntax highlighting
- **Real-time Preview** with split-pane layout
- **Auto-save** functionality (2-second debounce)
- **Rich Formatting** support with toolbar shortcuts
- **Word/Character Count** display

### 🔍 Advanced Search
- **Full-text Search** with relevance scoring
- **Advanced Filters**: categories, favorites, date ranges
- **Search Suggestions** with auto-complete
- **Multiple Sorting**: relevance, date, title
- **Fuzzy Matching** and intelligent ranking

### 📤 Export/Import
- **Multiple Formats**: Markdown, HTML, JSON, Plain Text
- **Batch Operations**: export/import multiple notes
- **Metadata Preservation**: dates, categories, tags
- **Conflict Resolution**: rename, overwrite, skip options
- **Drag & Drop Import** support

### 🎨 User Interface
- **Modern Design** with intuitive layout
- **Responsive Interface** adapts to window size
- **Dark/Light Theme** support
- **Keyboard Shortcuts** for power users
- **Modal Dialogs** for advanced operations

### 🖥️ Cross-Platform
- **Desktop App** (Electron) for Windows, macOS, Linux
- **Web App** for browser-based usage
- **Containerized** deployment with Docker
- **Production Ready** with nginx reverse proxy

## 🚀 Quick Start

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm or yarn
- Docker (optional, for containerized deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd notebook-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   # Web app only
   npm run dev

   # Desktop app (Electron + Web)
   npm run electron-dev
   ```

4. **Access the application**
   - Web: http://localhost:5173
   - Desktop: Electron window opens automatically

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+N` / `Ctrl+N` | New note |
| `Cmd+S` / `Ctrl+S` | Save note |
| `Cmd+F` / `Ctrl+F` | Focus search |
| `Cmd+Shift+F` | Advanced search |
| `Cmd+E` / `Ctrl+E` | Toggle preview |
| `Cmd+B` / `Ctrl+B` | Toggle sidebar |
| `Cmd+Shift+I` | Import notes |
| `Cmd+Shift+O` | Export current note |
| `Cmd+B` | Bold text |
| `Cmd+I` | Italic text |

## 🐳 Docker Deployment

### Quick Deploy
```bash
# Deploy with Docker Compose (recommended)
./deploy.sh deploy compose

# Deploy standalone container
./deploy.sh deploy standalone

# Build only
./deploy.sh build
```

### Manual Docker Commands
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or run standalone
docker build -t notebook:latest .
docker run -d -p 3000:3000 --name notebook-container notebook:latest
```

### Production with Nginx
```bash
# Deploy with nginx reverse proxy
docker-compose --profile production up -d
```

## 📁 Project Structure

```
notebook-app/
├── src/
│   ├── components/          # React components
│   │   ├── Common/         # Shared components
│   │   ├── Editor/         # Markdown editor components
│   │   ├── Layout/         # Layout components
│   │   └── Sidebar/        # Sidebar components
│   ├── services/           # Business logic services
│   │   ├── exportService.js
│   │   ├── importService.js
│   │   ├── markdownService.js
│   │   ├── noteService.js
│   │   └── searchService.js
│   ├── store/              # State management
│   ├── database/           # Database layer
│   └── utils/              # Utility functions
├── electron/               # Electron main process
├── docker/                 # Docker configuration
├── deploy.sh              # Deployment script
└── DESIGN.md              # Detailed design document
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server
npm run electron-dev     # Start Electron + Vite dev server

# Building
npm run build           # Build for production
npm run electron-build  # Build and run Electron app

# Distribution
npm run dist           # Create distributable packages
npm run dist-mac       # Build for macOS
npm run dist-win       # Build for Windows
npm run dist-linux     # Build for Linux

# Docker
./deploy.sh build      # Build Docker image
./deploy.sh deploy     # Deploy with Docker
```

## 🔧 Configuration

### Environment Variables
- `NODE_ENV`: Set to 'development' for dev mode
- `VITE_APP_TITLE`: Application title
- `ELECTRON_IS_DEV`: Electron development flag

### Database
- Uses localStorage for data persistence
- SQLite support available (see DESIGN.md)
- Data stored in browser's local storage

## 📚 Documentation

- [Design Document](DESIGN.md) - Comprehensive system design
- [Deployment Guide](DEPLOYMENT.md) - Detailed deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI framework
- [Electron](https://electronjs.org/) - Desktop app framework
- [Vite](https://vitejs.dev/) - Build tool
- [unified.js](https://unifiedjs.com/) - Markdown processing
- [Zustand](https://github.com/pmndrs/zustand) - State management

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Review the [Design Document](DESIGN.md)
3. Check the [Deployment Guide](DEPLOYMENT.md)

## 🎯 Current Status

✅ **Core Features**: Complete note-taking functionality
✅ **Advanced Search**: Full-text search with filters
✅ **Export/Import**: Multiple format support
✅ **Desktop App**: Electron application working
✅ **Web App**: Browser-based version available
✅ **Containerization**: Docker deployment ready

## 🚀 Getting Started Now

The application is currently running:
- **Web Version**: http://localhost:5173
- **Desktop App**: Electron window (if running `npm run electron-dev`)

Start creating notes and explore all the advanced features!

---

**Built with ❤️ for the markdown community**
