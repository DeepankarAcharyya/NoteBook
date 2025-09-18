# NoteBook App Deployment Guide

This guide covers how to deploy the NoteBook application using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.0 or higher)
- Docker Compose (version 2.0 or higher)
- Node.js (version 20 or higher) for local development

## Quick Start

### Using the Deployment Script (Recommended)

1. **Deploy with Docker Compose:**
   ```bash
   ./deploy.sh deploy compose
   ```

2. **Deploy as Standalone Container:**
   ```bash
   ./deploy.sh deploy standalone
   ```

3. **Build Only:**
   ```bash
   ./deploy.sh build
   ```

### Manual Deployment

1. **Build the Application:**
   ```bash
   cd notebook-app
   npm install
   npm run build
   cd ..
   ```

2. **Build Docker Image:**
   ```bash
   docker build -t notebook:latest .
   ```

3. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Or Run Standalone:**
   ```bash
   docker run -d \
     --name notebook-container \
     -p 3000:3000 \
     --restart unless-stopped \
     notebook:latest
   ```

## Deployment Options

### Option 1: Docker Compose (Recommended)

Docker Compose provides the most flexible deployment with optional nginx reverse proxy:

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

**Features:**
- Automatic container orchestration
- Volume persistence for data
- Health checks
- Optional nginx reverse proxy
- Easy scaling and updates

### Option 2: Standalone Container

For simple deployments without additional services:

```bash
# Run the container
docker run -d \
  --name notebook-container \
  -p 3000:3000 \
  -v notebook_data:/app/data \
  --restart unless-stopped \
  notebook:latest

# View logs
docker logs -f notebook-container

# Stop the container
docker stop notebook-container
```

### Option 3: Production with Nginx

For production deployments with SSL and reverse proxy:

```bash
# Deploy with nginx profile
docker-compose --profile production up -d
```

This includes:
- Nginx reverse proxy
- SSL termination (configure certificates)
- Rate limiting
- Static file caching
- Security headers

## Configuration

### Environment Variables

The application supports the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Application environment |
| `PORT` | `3000` | Port to run the application |
| `HOSTNAME` | `0.0.0.0` | Host to bind the application |

### Docker Compose Configuration

Edit `docker-compose.yml` to customize:

```yaml
services:
  notebook-app:
    environment:
      - NODE_ENV=production
      - PORT=3000
    ports:
      - "3000:3000"  # Change external port here
    volumes:
      - notebook_data:/app/data  # Persistent data storage
```

### Nginx Configuration

For production deployments, customize `nginx.conf`:

- SSL certificates: Place in `./ssl/` directory
- Domain configuration: Update `server_name`
- Rate limiting: Adjust `limit_req_zone`
- Caching: Modify cache headers

## Data Persistence

The application uses localStorage for data storage in the browser. For server-side persistence:

1. **Volume Mounting:**
   ```bash
   docker run -v /host/data:/app/data notebook:latest
   ```

2. **Docker Compose:**
   ```yaml
   volumes:
     - ./data:/app/data
     - notebook_data:/app/data  # Named volume
   ```

## Monitoring and Maintenance

### Health Checks

The application includes health check endpoints:

```bash
# Check application health
curl http://localhost:3000/health

# Docker health check
docker inspect --format='{{.State.Health.Status}}' notebook-container
```

### Logs

View application logs:

```bash
# Docker Compose
docker-compose logs -f

# Standalone container
docker logs -f notebook-container

# Follow specific service logs
docker-compose logs -f notebook-app
```

### Updates

To update the application:

1. **Pull latest code:**
   ```bash
   git pull origin main
   ```

2. **Rebuild and deploy:**
   ```bash
   ./deploy.sh deploy compose
   ```

3. **Or manually:**
   ```bash
   docker-compose down
   docker build -t notebook:latest .
   docker-compose up -d
   ```

## Troubleshooting

### Common Issues

1. **Port Already in Use:**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Use different port
   docker run -p 3001:3000 notebook:latest
   ```

2. **Permission Issues:**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x deploy.sh
   ```

3. **Build Failures:**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker build --no-cache -t notebook:latest .
   ```

4. **Container Won't Start:**
   ```bash
   # Check logs
   docker logs notebook-container
   
   # Run interactively for debugging
   docker run -it --rm notebook:latest sh
   ```

### Performance Tuning

1. **Memory Limits:**
   ```yaml
   services:
     notebook-app:
       deploy:
         resources:
           limits:
             memory: 512M
           reservations:
             memory: 256M
   ```

2. **CPU Limits:**
   ```yaml
   services:
     notebook-app:
       deploy:
         resources:
           limits:
             cpus: '0.5'
   ```

## Security Considerations

1. **Use HTTPS in Production:**
   - Configure SSL certificates in nginx
   - Redirect HTTP to HTTPS
   - Use security headers

2. **Network Security:**
   - Use Docker networks for service isolation
   - Limit exposed ports
   - Configure firewall rules

3. **Container Security:**
   - Run as non-root user (already configured)
   - Use minimal base images
   - Regular security updates

## Backup and Recovery

### Data Backup

```bash
# Backup Docker volume
docker run --rm -v notebook_data:/data -v $(pwd):/backup alpine tar czf /backup/notebook-backup.tar.gz -C /data .

# Restore from backup
docker run --rm -v notebook_data:/data -v $(pwd):/backup alpine tar xzf /backup/notebook-backup.tar.gz -C /data
```

### Configuration Backup

```bash
# Backup configuration
tar czf notebook-config-backup.tar.gz docker-compose.yml nginx.conf .env
```

## Scaling

For high-traffic deployments:

1. **Horizontal Scaling:**
   ```yaml
   services:
     notebook-app:
       deploy:
         replicas: 3
   ```

2. **Load Balancing:**
   - Configure nginx upstream servers
   - Use external load balancer
   - Implement session affinity if needed

3. **Database Scaling:**
   - Consider external database for shared storage
   - Implement database clustering
   - Use read replicas for better performance

## Support

For issues and questions:
- Check the troubleshooting section above
- Review application logs
- Check Docker and system resources
- Consult the main README.md for application-specific help
