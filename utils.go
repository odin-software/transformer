package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/h2non/bimg"
)

func InitializeDirectories() {
	if _, err := os.Stat(QUEUE_DIR); os.IsNotExist(err) {
		err := os.MkdirAll(QUEUE_DIR, 0755)
		if err != nil {
			panic(err)
		}
	}
	if _, err := os.Stat(DONE_DIR); os.IsNotExist(err) {
		err := os.MkdirAll(DONE_DIR, 0755)
		if err != nil {
			panic(err)
		}
	}
}

func GetTypeFromString(t string) bimg.ImageType {
	switch t {
	case "webp":
		return bimg.WEBP
	case "png":
		return bimg.PNG
	case "heif":
		return bimg.HEIF
	case "jpeg":
		return bimg.JPEG
	}
	return bimg.WEBP
}

func CleanupDirectory(DIR string) {
	dir, err := os.ReadDir(DIR)
	if err != nil {
		panic(err)
	}
	for _, entry := range dir {
		if entry.IsDir() {
			continue
		}
		fileName := fmt.Sprintf("%s/%s", DIR, entry.Name())
		err := os.Remove(fileName)
		if err != nil {
			log.Printf("error cleaning up file: %s", fileName)
		}
	}
}

func ConvertTo(file string, extention string, tp bimg.ImageType) (string, error) {
	buffer, err := bimg.Read("files/queue/" + file)
	if err != nil {
		return "", err
	}
	newImage, err := bimg.NewImage(buffer).Convert(tp)
	if err != nil {
		return "", err
	}
	strs := strings.Split(file, ".")
	newFilePath := "files/done/" + strs[0] + "." + extention

	return newFilePath, os.WriteFile(newFilePath, newImage, 0644)
}

func Compress(file string, per int) (string, error) {
	buffer, err := bimg.Read("files/queue/" + file)
	if err != nil {
		return "", err
	}
	newImage, err := bimg.NewImage(buffer).Process(bimg.Options{
		Quality: per,
	})
	if err != nil {
		return "", err
	}
	newFilePath := "files/done/" + file

	return newFilePath, os.WriteFile(newFilePath, newImage, 0644)
}

// Security functions

// generateUniqueID creates a unique identifier for files
func generateUniqueID() string {
	timestamp := time.Now().UnixNano()
	randomBytes := make([]byte, 4)
	rand.Read(randomBytes)
	return fmt.Sprintf("%d_%s", timestamp, hex.EncodeToString(randomBytes))
}

// sanitizeFilename removes dangerous characters and path components
func sanitizeFilename(filename string) string {
	// Get just the filename, no path components
	filename = filepath.Base(filename)

	// Remove or replace dangerous characters
	reg := regexp.MustCompile(`[^a-zA-Z0-9._-]`)
	filename = reg.ReplaceAllString(filename, "_")

	// Ensure it's not empty and has reasonable length
	if filename == "" || filename == "." || filename == ".." {
		filename = "file"
	}

	// Limit length to prevent issues
	if len(filename) > 100 {
		ext := filepath.Ext(filename)
		name := strings.TrimSuffix(filename, ext)
		if len(name) > 95 {
			name = name[:95]
		}
		filename = name + ext
	}

	return filename
}

// createUniqueFilename generates a unique filename with sanitization
func createUniqueFilename(originalFilename string) string {
	sanitized := sanitizeFilename(originalFilename)
	uniqueID := generateUniqueID()

	ext := filepath.Ext(sanitized)
	name := strings.TrimSuffix(sanitized, ext)

	return fmt.Sprintf("%s_%s%s", name, uniqueID, ext)
}

// validateImageFile checks if the uploaded file is a valid image
func validateImageFile(file multipart.File) error {
	// Read first 512 bytes to check magic numbers
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil {
		return fmt.Errorf("failed to read file header: %w", err)
	}

	// Reset file pointer to beginning
	file.Seek(0, 0)

	// Check magic bytes for common image formats
	if n < 4 {
		return fmt.Errorf("file too small to be a valid image")
	}

	// JPEG: FF D8 FF
	if buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF {
		return nil
	}

	// PNG: 89 50 4E 47
	if buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47 {
		return nil
	}

	// WebP: RIFF ... WEBP
	if n >= 12 && buffer[0] == 0x52 && buffer[1] == 0x49 && buffer[2] == 0x46 && buffer[3] == 0x46 &&
		buffer[8] == 0x57 && buffer[9] == 0x45 && buffer[10] == 0x42 && buffer[11] == 0x50 {
		return nil
	}

	// HEIF/HEIC: ... ftyp ... (more complex, simplified check)
	if n >= 12 && buffer[4] == 0x66 && buffer[5] == 0x74 && buffer[6] == 0x79 && buffer[7] == 0x70 {
		// Check for HEIC/HEIF brands
		for i := 8; i < n-4; i++ {
			if buffer[i] == 0x68 && buffer[i+1] == 0x65 && buffer[i+2] == 0x69 && buffer[i+3] == 0x63 {
				return nil // HEIC
			}
			if buffer[i] == 0x6D && buffer[i+1] == 0x69 && buffer[i+2] == 0x66 && buffer[i+3] == 0x31 {
				return nil // HEIF
			}
		}
	}

	return fmt.Errorf("unsupported file format - only JPEG, PNG, WebP, and HEIC/HEIF are allowed")
}

// validateFileSize checks if file size is within limits
func validateFileSize(file multipart.File, maxSizeMB int) error {
	// Get current position
	currentPos, _ := file.Seek(0, 1)

	// Get file size
	size, err := file.Seek(0, 2)
	if err != nil {
		return fmt.Errorf("failed to get file size: %w", err)
	}

	// Reset to original position
	file.Seek(currentPos, 0)

	maxSize := int64(maxSizeMB * 1024 * 1024)
	if size > maxSize {
		return fmt.Errorf("file size %d bytes exceeds maximum allowed size of %d MB", size, maxSizeMB)
	}

	return nil
}
