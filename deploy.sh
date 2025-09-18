#!/bin/bash

# NoteBook App Deployment Script
# This script builds and deploys the NoteBook application using Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="notebook-app"
IMAGE_NAME="notebook"
CONTAINER_NAME="notebook-container"
PORT=3000
NGINX_PORT=80

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Docker and Docker Compose are installed"
}

# Build the application
build_app() {
    log_info "Building the NoteBook application..."
    
    cd notebook-app
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm install
    
    # Build the application
    log_info "Building the application..."
    npm run build
    
    cd ..
    
    log_success "Application built successfully"
}

# Build Docker image
build_docker_image() {
    log_info "Building Docker image..."
    
    docker build -t $IMAGE_NAME:latest .
    
    log_success "Docker image built successfully"
}

# Deploy with Docker Compose
deploy_with_compose() {
    log_info "Deploying with Docker Compose..."
    
    # Stop existing containers
    docker-compose down 2>/dev/null || true
    
    # Start the application
    docker-compose up -d
    
    log_success "Application deployed successfully"
}

# Deploy standalone container
deploy_standalone() {
    log_info "Deploying standalone container..."
    
    # Stop and remove existing container
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    
    # Run the container
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:3000 \
        --restart unless-stopped \
        $IMAGE_NAME:latest
    
    log_success "Container deployed successfully"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Wait for the application to start
    sleep 10
    
    # Check if the application is responding
    if curl -f http://localhost:$PORT > /dev/null 2>&1; then
        log_success "Application is healthy and responding"
    else
        log_warning "Application might not be ready yet. Please check manually."
    fi
}

# Show deployment information
show_info() {
    echo ""
    echo "======================================"
    echo "  NoteBook App Deployment Complete"
    echo "======================================"
    echo ""
    echo "Application URL: http://localhost:$PORT"
    echo "Container Name: $CONTAINER_NAME"
    echo "Image Name: $IMAGE_NAME:latest"
    echo ""
    echo "Useful commands:"
    echo "  View logs: docker logs $CONTAINER_NAME"
    echo "  Stop app:  docker stop $CONTAINER_NAME"
    echo "  Start app: docker start $CONTAINER_NAME"
    echo "  Remove:    docker rm $CONTAINER_NAME"
    echo ""
    echo "With Docker Compose:"
    echo "  View logs: docker-compose logs"
    echo "  Stop app:  docker-compose down"
    echo "  Start app: docker-compose up -d"
    echo ""
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Remove unused Docker images
    docker image prune -f
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    local deployment_type=${1:-"compose"}
    
    echo "======================================"
    echo "  NoteBook App Deployment Script"
    echo "======================================"
    echo ""
    
    check_docker
    build_app
    build_docker_image
    
    case $deployment_type in
        "compose")
            deploy_with_compose
            ;;
        "standalone")
            deploy_standalone
            ;;
        *)
            log_error "Invalid deployment type. Use 'compose' or 'standalone'"
            exit 1
            ;;
    esac
    
    health_check
    show_info
    
    # Optional cleanup
    read -p "Do you want to clean up unused Docker images? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    fi
}

# Handle script arguments
case "${1:-}" in
    "build")
        check_docker
        build_app
        build_docker_image
        ;;
    "deploy")
        main "${2:-compose}"
        ;;
    "clean")
        log_info "Stopping and removing containers..."
        docker-compose down 2>/dev/null || true
        docker stop $CONTAINER_NAME 2>/dev/null || true
        docker rm $CONTAINER_NAME 2>/dev/null || true
        docker rmi $IMAGE_NAME:latest 2>/dev/null || true
        log_success "Cleanup completed"
        ;;
    "logs")
        if docker ps | grep -q $CONTAINER_NAME; then
            docker logs -f $CONTAINER_NAME
        else
            docker-compose logs -f
        fi
        ;;
    "status")
        echo "Container Status:"
        docker ps | grep $IMAGE_NAME || echo "No containers running"
        echo ""
        echo "Image Status:"
        docker images | grep $IMAGE_NAME || echo "No images found"
        ;;
    *)
        echo "Usage: $0 {build|deploy [compose|standalone]|clean|logs|status}"
        echo ""
        echo "Commands:"
        echo "  build      - Build the application and Docker image"
        echo "  deploy     - Deploy the application (default: compose)"
        echo "  clean      - Stop and remove all containers and images"
        echo "  logs       - Show application logs"
        echo "  status     - Show container and image status"
        echo ""
        echo "Examples:"
        echo "  $0 deploy compose     - Deploy with Docker Compose"
        echo "  $0 deploy standalone  - Deploy as standalone container"
        echo "  $0 build             - Build only"
        echo "  $0 clean             - Clean up everything"
        exit 1
        ;;
esac
