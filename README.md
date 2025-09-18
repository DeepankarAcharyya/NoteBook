# 📝 NoteBook Project

A comprehensive markdown note-taking application ecosystem with advanced features, containerization, and cross-platform support.

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-green) ![React](https://img.shields.io/badge/React-18-blue) ![Electron](https://img.shields.io/badge/Electron-Latest-green) ![Docker](https://img.shields.io/badge/Docker-Ready-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 🏗️ Project Structure

```
NoteBook/
├── notebook-app/           # Main application directory
│   ├── src/               # React application source
│   ├── electron/          # Electron main process
│   ├── public/            # Static assets
│   └── README.md          # Application-specific documentation
├── src/                   # Additional services and components
│   ├── components/        # Enhanced UI components
│   └── services/          # Advanced service implementations
├── DESIGN.md              # Comprehensive system design
├── DEPLOYMENT.md          # Deployment guide and instructions
├── docker-compose.yml     # Container orchestration
├── Dockerfile             # Container build configuration
├── nginx.conf             # Reverse proxy configuration
├── deploy.sh              # Automated deployment script
└── LICENSE                # MIT License
```

## 🚀 Quick Start

### Option 1: Development Mode
```bash
# Navigate to the main application
cd notebook-app

# Install dependencies
npm install

# Start development server (web + desktop)
npm run electron-dev
```

### Option 2: Docker Deployment
```bash
# Quick deploy with automated script
./deploy.sh deploy compose

# Or manual Docker Compose
docker-compose up -d
```

### Option 3: Production Deployment
```bash
# Deploy with nginx reverse proxy
docker-compose --profile production up -d
```

## ✨ What's Included

### 📱 **Main Application** (`/notebook-app/`)
- **React 18** with Vite for fast development
- **Electron** desktop application
- **Advanced markdown editor** with live preview
- **Full-text search** with intelligent filtering
- **Export/Import** in multiple formats
- **Auto-save** and data persistence

### 🔧 **Enhanced Components** (`/src/`)
- **Advanced Search Modal** with filters and suggestions
- **Export/Import Modals** with progress tracking
- **Enhanced Services** for search, export, and import
- **Utility Functions** for data processing

### 🐳 **Containerization**
- **Multi-stage Docker builds** for optimization
- **Docker Compose** with optional nginx
- **Production-ready** configuration
- **Automated deployment** scripts

### 📚 **Documentation**
- **[DESIGN.md](DESIGN.md)** - Complete system architecture
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide
- **[notebook-app/README.md](notebook-app/README.md)** - Application documentation

## 🎯 Features Overview

### Core Functionality
- ✅ **Markdown Editor** with syntax highlighting
- ✅ **Live Preview** with real-time rendering
- ✅ **Auto-save** with conflict resolution
- ✅ **Note Organization** with categories and favorites
- ✅ **Search & Filter** with advanced options

### Advanced Features
- ✅ **Full-text Search** with relevance scoring
- ✅ **Export Formats**: Markdown, HTML, JSON, Plain Text
- ✅ **Import Support**: Multiple file formats with preview
- ✅ **Batch Operations** for bulk export/import
- ✅ **Keyboard Shortcuts** for power users

### Technical Features
- ✅ **Cross-platform** desktop app (Electron)
- ✅ **Web application** for browser usage
- ✅ **Containerized** deployment with Docker
- ✅ **Production ready** with nginx reverse proxy
- ✅ **Hot reload** development environment

## 🛠️ Development

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm or yarn
- Docker (optional)

### Development Workflow
```bash
# 1. Clone and setup
git clone <repository-url>
cd NoteBook/notebook-app
npm install

# 2. Start development
npm run electron-dev    # Desktop + Web app
# OR
npm run dev            # Web app only

# 3. Build for production
npm run build          # Web build
npm run dist           # Desktop distributables
```

### Available Scripts
- `npm run dev` - Start Vite development server
- `npm run electron-dev` - Start Electron + Vite
- `npm run build` - Build for production
- `npm run dist` - Create desktop distributables
- `./deploy.sh` - Docker deployment automation

## 🌐 Access Points

### Development
- **Web App**: http://localhost:5173
- **Desktop App**: Electron window (auto-opens)

### Production (Docker)
- **Standalone**: http://localhost:3000
- **With nginx**: http://localhost:80

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [DESIGN.md](DESIGN.md) | Complete system architecture and design decisions |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Comprehensive deployment guide with troubleshooting |
| [notebook-app/README.md](notebook-app/README.md) | Application-specific documentation and usage |

## 🐳 Deployment Options

### 1. Docker Compose (Recommended)
```bash
./deploy.sh deploy compose
```

### 2. Standalone Container
```bash
./deploy.sh deploy standalone
```

### 3. Production with Nginx
```bash
docker-compose --profile production up -d
```

### 4. Manual Build
```bash
cd notebook-app
npm run build
npm run dist
```

## 🔧 Configuration

### Environment Variables
- `NODE_ENV` - Environment mode (development/production)
- `VITE_APP_TITLE` - Application title
- `ELECTRON_IS_DEV` - Electron development flag

### Docker Configuration
- **Port 3000**: Application server
- **Port 80**: Nginx reverse proxy (production profile)
- **Volumes**: Data persistence and configuration

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow the existing code structure
- Add tests for new features
- Update documentation as needed
- Ensure Docker builds work correctly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Electron Team** for cross-platform desktop apps
- **Vite Team** for the fast build tool
- **Docker Team** for containerization technology
- **Open Source Community** for the incredible ecosystem

## 📞 Support & Issues

- **Issues**: Report bugs and feature requests in the Issues section
- **Documentation**: Check DESIGN.md and DEPLOYMENT.md for detailed information
- **Discussions**: Use GitHub Discussions for questions and ideas

## 🎯 Current Status

✅ **Fully Functional** - All core features implemented  
✅ **Production Ready** - Docker deployment configured  
✅ **Cross-Platform** - Web and desktop versions working  
✅ **Well Documented** - Comprehensive documentation available  
✅ **Containerized** - Docker and Docker Compose ready  

---

**Start building your markdown notes today!** 🚀

Choose your preferred method:
- **Quick Start**: `cd notebook-app && npm run electron-dev`
- **Docker**: `./deploy.sh deploy compose`
- **Web Only**: `cd notebook-app && npm run dev`
