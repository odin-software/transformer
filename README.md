# Transformer

A minimal, professional web application for image transformation. Convert between formats (WebP, PNG, JPEG, HEIC) and compress images with customizable quality settings.

## Features

- **Convert**: Transform images between popular formats
- **Compress**: Reduce image file sizes with quality control
- **Modern UI**: Clean, responsive design with drag-and-drop support
- **Fast Processing**: Built with Go and libvips for optimal performance

## Quick Start

### Using Docker (Recommended)

```bash
docker build -t transformer .
docker run -p 9090:9090 transformer
```

### Local Development

1. **Prerequisites**: Install Go 1.22+ and libvips
2. **Install dependencies**:
   ```bash
   go mod download
   ```
3. **Run the application**:
   ```bash
   go run .
   ```

Visit `http://localhost:9090` to start transforming your images.
