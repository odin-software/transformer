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
	"sync"
	"time"

	"github.com/h2non/bimg"
)

func InitializeDirectories() {
	if err := os.MkdirAll(QUEUE_DIR, 0755); err != nil {
		log.Fatalf("failed to create queue directory: %v", err)
	}
	if err := os.MkdirAll(DONE_DIR, 0755); err != nil {
		log.Fatalf("failed to create done directory: %v", err)
	}
}

func GetTypeFromString(t string) bimg.ImageType {
	switch t {
	case "webp":
		return bimg.WEBP
	case "png":
		return bimg.PNG
	case "jpeg":
		return bimg.JPEG
	}
	return bimg.WEBP
}

func CleanupDirectory(DIR string) {
	dir, err := os.ReadDir(DIR)
	if err != nil {
		log.Printf("error reading dir for cleanup %s: %v", DIR, err)
		return
	}
	var count int
	for _, entry := range dir {
		if entry.IsDir() {
			continue
		}
		fileName := fmt.Sprintf("%s/%s", DIR, entry.Name())
		if err := os.Remove(fileName); err != nil {
			log.Printf("error cleaning up file: %s", fileName)
		} else {
			count++
		}
	}
	if count > 0 {
		log.Printf("Cleanup %s: removed %d file(s)", DIR, count)
	}
}

func generateUniqueID() string {
	randomBytes := make([]byte, 16)
	rand.Read(randomBytes)
	return hex.EncodeToString(randomBytes)
}

func sanitizeFilename(filename string) string {
	filename = filepath.Base(filename)

	reg := regexp.MustCompile(`[^a-zA-Z0-9._-]`)
	filename = reg.ReplaceAllString(filename, "_")

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

func createUniqueFilename(originalFilename string) string {
	sanitized := sanitizeFilename(originalFilename)
	uniqueID := generateUniqueID()

	ext := filepath.Ext(sanitized)
	name := strings.TrimSuffix(sanitized, ext)

	return fmt.Sprintf("%s_%s%s", name, uniqueID, ext)
}

func validateImageFile(file multipart.File) error {
	// Read first 512 bytes to check magic numbers
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil {
		return fmt.Errorf("failed to read file header: %w", err)
	}

	file.Seek(0, 0)

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

	return fmt.Errorf("unsupported file format - only JPEG, PNG, and WebP are allowed")
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

// Job system structures and functions
type JobStatus string

const (
	JobPending    JobStatus = "pending"
	JobProcessing JobStatus = "processing"
	JobCompleted  JobStatus = "completed"
	JobFailed     JobStatus = "failed"
)

type JobType string

const (
	JobTypeConvert  JobType = "convert"
	JobTypeCompress JobType = "compress"
)

type Job struct {
	ID           string    `json:"id"`
	Type         JobType   `json:"type"`
	Status       JobStatus `json:"status"`
	InputFile    string    `json:"-"`
	OutputFile   string    `json:"output_file,omitempty"`
	ErrorMessage string    `json:"-"`
	UserError    string    `json:"error,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	StartedAt    *time.Time `json:"started_at,omitempty"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`

	ConvertTo string `json:"convert_to,omitempty"` // For convert jobs
	Quality   int    `json:"quality,omitempty"`    // For compress jobs
}

type JobStore struct {
	mu   sync.RWMutex
	jobs map[string]*Job
}

var jobStore = &JobStore{
	jobs: make(map[string]*Job),
}

var jobQueue = make(chan *Job, 100)

func CreateJob(jobType JobType, inputFile string) *Job {
	job := &Job{
		ID:        generateUniqueID(),
		Type:      jobType,
		Status:    JobPending,
		InputFile: inputFile,
		CreatedAt: time.Now(),
	}

	jobStore.mu.Lock()
	jobStore.jobs[job.ID] = job
	jobStore.mu.Unlock()

	return job
}

func GetJob(id string) (*Job, bool) {
	jobStore.mu.RLock()
	defer jobStore.mu.RUnlock()
	job, exists := jobStore.jobs[id]
	return job, exists
}

func UpdateJobStatus(jobID string, status JobStatus, errorMsg ...string) {
	jobStore.mu.Lock()
	defer jobStore.mu.Unlock()

	job, exists := jobStore.jobs[jobID]
	if !exists {
		return
	}

	job.Status = status
	now := time.Now()

	switch status {
	case JobProcessing:
		job.StartedAt = &now
	case JobCompleted, JobFailed:
		job.CompletedAt = &now
		if len(errorMsg) > 0 {
			job.ErrorMessage = errorMsg[0]
			job.UserError = "Processing failed"
		}
	}
}

func SetJobOutput(jobID, outputFile string) {
	jobStore.mu.Lock()
	defer jobStore.mu.Unlock()

	job, exists := jobStore.jobs[jobID]
	if exists {
		job.OutputFile = outputFile
	}
}

func isKnownJobOutput(outputPath string) bool {
	jobStore.mu.RLock()
	defer jobStore.mu.RUnlock()

	for _, job := range jobStore.jobs {
		if job.Status == JobCompleted && job.OutputFile == outputPath {
			return true
		}
	}
	return false
}

func EnqueueJob(job *Job) {
	select {
	case jobQueue <- job:
		log.Printf("Job %s enqueued successfully", job.ID)
	default:
		log.Printf("Job queue full, job %s rejected", job.ID)
		UpdateJobStatus(job.ID, JobFailed, "Job queue is full")
	}
}

func PruneCompletedJobs(maxAge time.Duration) {
	jobStore.mu.Lock()
	defer jobStore.mu.Unlock()

	now := time.Now()
	var count int
	for id, job := range jobStore.jobs {
		if job.Status == JobCompleted || job.Status == JobFailed {
			if job.CompletedAt != nil && now.Sub(*job.CompletedAt) > maxAge {
				delete(jobStore.jobs, id)
				count++
			}
		}
	}
	if count > 0 {
		log.Printf("Pruned %d completed/failed job(s) from store", count)
	}
}

func removeQueueFile(filename string) {
	path := QUEUE_DIR + filename
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		log.Printf("error removing queue file %s: %v", path, err)
	}
}

func StartJobWorkers(numWorkers int) {
	for i := 0; i < numWorkers; i++ {
		go jobWorker(i)
	}
	log.Printf("Started %d job workers", numWorkers)
}

func jobWorker(workerID int) {
	log.Printf("Job worker %d started", workerID)

	for job := range jobQueue {
		log.Printf("Worker %d processing job %s (type: %s)", workerID, job.ID, job.Type)

		UpdateJobStatus(job.ID, JobProcessing)

		var err error
		switch job.Type {
		case JobTypeConvert:
			err = processConvertJob(job)
		case JobTypeCompress:
			err = processCompressJob(job)
		default:
			err = fmt.Errorf("unknown job type: %s", job.Type)
		}

		if err != nil {
			log.Printf("Worker %d failed to process job %s: %v", workerID, job.ID, err)
			UpdateJobStatus(job.ID, JobFailed, err.Error())
		} else {
			log.Printf("Worker %d completed job %s successfully", workerID, job.ID)
			UpdateJobStatus(job.ID, JobCompleted)
		}

		removeQueueFile(job.InputFile)
	}
}

func processConvertJob(job *Job) error {
	if job.ConvertTo == "" {
		return fmt.Errorf("convert target format not specified")
	}

	inputPath := "files/queue/" + job.InputFile
	buffer, err := bimg.Read(inputPath)
	if err != nil {
		return fmt.Errorf("failed to read input file: %w", err)
	}

	imageType := GetTypeFromString(job.ConvertTo)
	newImage, err := bimg.NewImage(buffer).Convert(imageType)
	if err != nil {
		return fmt.Errorf("failed to convert image: %w", err)
	}

	ext := filepath.Ext(job.InputFile)
	outputFilename := strings.TrimSuffix(job.InputFile, ext) + "." + job.ConvertTo
	outputPath := "files/done/" + outputFilename

	if err := os.WriteFile(outputPath, newImage, 0644); err != nil {
		return fmt.Errorf("failed to save converted image: %w", err)
	}

	SetJobOutput(job.ID, outputPath)

	return nil
}

func processCompressJob(job *Job) error {
	if job.Quality <= 0 || job.Quality > 100 {
		return fmt.Errorf("invalid quality setting: %d", job.Quality)
	}

	inputPath := "files/queue/" + job.InputFile
	buffer, err := bimg.Read(inputPath)
	if err != nil {
		return fmt.Errorf("failed to read input file: %w", err)
	}

	newImage, err := bimg.NewImage(buffer).Process(bimg.Options{
		Quality: job.Quality,
	})
	if err != nil {
		return fmt.Errorf("failed to compress image: %w", err)
	}

	outputPath := "files/done/" + job.InputFile

	if err := os.WriteFile(outputPath, newImage, 0644); err != nil {
		return fmt.Errorf("failed to save compressed image: %w", err)
	}

	SetJobOutput(job.ID, outputPath)

	return nil
}
