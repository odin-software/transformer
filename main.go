package main

import (
	"encoding/json"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
)

const QUEUE_DIR = "files/queue/"
const DONE_DIR = "files/done/"

func main() {
	InitializeDirectories()

	StartJobWorkers(3) // Start 3 worker goroutines

	queueTicker := time.NewTicker(20 * time.Second)
	doneTicker := time.NewTicker(3 * time.Minute)

	mux := http.NewServeMux()

	fs := http.FileServer(http.Dir("./static"))
	doneFs := http.FileServer(http.Dir("./files/done"))
	mux.Handle("GET /static/", http.StripPrefix("/static/", fs))
	mux.Handle("GET /files/done/", http.StripPrefix("/files/done/", doneFs))

	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		t, err := template.ParseFiles("views/layout.html", "views/index.html")
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		err = t.ExecuteTemplate(w, "layout", "")
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	})

	mux.HandleFunc("GET /convert", func(w http.ResponseWriter, r *http.Request) {
		t, err := template.ParseFiles("views/layout.html", "views/convert.html")
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		err = t.ExecuteTemplate(w, "layout", "Convert")
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	})

	mux.HandleFunc("GET /compress", func(w http.ResponseWriter, r *http.Request) {
		t, err := template.ParseFiles("views/layout.html", "views/compress.html")
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		err = t.ExecuteTemplate(w, "layout", "Compress")
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	})

	mux.HandleFunc("POST /convert/{to}", func(w http.ResponseWriter, r *http.Request) {
		r.ParseMultipartForm(10 << 20)
		to := r.PathValue("to")
		file, header, err := r.FormFile("file")
		if err != nil {
			log.Printf("Error getting form file: %v", err)
			http.Error(w, "Failed to process uploaded file", http.StatusBadRequest)
			return
		}
		defer file.Close()

		if err := validateFileSize(file, 50); err != nil {
			log.Printf("File size validation failed: %v", err)
			http.Error(w, "File too large - maximum 50MB allowed", http.StatusRequestEntityTooLarge)
			return
		}

		if err := validateImageFile(file); err != nil {
			log.Printf("File type validation failed: %v", err)
			http.Error(w, "Invalid file type - only JPEG, PNG, WebP, and HEIC/HEIF are supported", http.StatusUnsupportedMediaType)
			return
		}

		uniqueFilename := createUniqueFilename(header.Filename)
		queuePath := "files/queue/" + uniqueFilename

		dst, err := os.Create(queuePath)
		if err != nil {
			log.Printf("Error creating queue file: %v", err)
			http.Error(w, "Failed to save uploaded file", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		if _, err := io.Copy(dst, file); err != nil {
			log.Printf("Error copying file: %v", err)
			http.Error(w, "Failed to save uploaded file", http.StatusInternalServerError)
			return
		}

		job := CreateJob(JobTypeConvert, uniqueFilename)
		job.ConvertTo = to

		EnqueueJob(job)

		w.Header().Set("Content-Type", "application/json")
		response := map[string]string{
			"job_id": job.ID,
			"status": string(job.Status),
			"message": "Job queued for processing",
		}
		json.NewEncoder(w).Encode(response)
	})

	mux.HandleFunc("POST /compress", func(w http.ResponseWriter, r *http.Request) {
		r.ParseMultipartForm(10 << 20)
		per := r.FormValue("per")
		val, err := strconv.Atoi(per)
		if err != nil || val < 1 || val > 100 {
			log.Printf("Invalid compression percentage: %s", per)
			http.Error(w, "Invalid compression percentage - must be between 1-100", http.StatusBadRequest)
			return
		}

		file, header, err := r.FormFile("file")
		if err != nil {
			log.Printf("Error getting form file: %v", err)
			http.Error(w, "Failed to process uploaded file", http.StatusBadRequest)
			return
		}
		defer file.Close()

		if err := validateFileSize(file, 50); err != nil {
			log.Printf("File size validation failed: %v", err)
			http.Error(w, "File too large - maximum 50MB allowed", http.StatusRequestEntityTooLarge)
			return
		}

		if err := validateImageFile(file); err != nil {
			log.Printf("File type validation failed: %v", err)
			http.Error(w, "Invalid file type - only JPEG, PNG, WebP, and HEIC/HEIF are supported", http.StatusUnsupportedMediaType)
			return
		}

		uniqueFilename := createUniqueFilename(header.Filename)
		queuePath := "files/queue/" + uniqueFilename

		dst, err := os.Create(queuePath)
		if err != nil {
			log.Printf("Error creating queue file: %v", err)
			http.Error(w, "Failed to save uploaded file", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		if _, err := io.Copy(dst, file); err != nil {
			log.Printf("Error copying file: %v", err)
			http.Error(w, "Failed to save uploaded file", http.StatusInternalServerError)
			return
		}

		job := CreateJob(JobTypeCompress, uniqueFilename)
		job.Quality = val

		EnqueueJob(job)

		w.Header().Set("Content-Type", "application/json")
		response := map[string]string{
			"job_id": job.ID,
			"status": string(job.Status),
			"message": "Job queued for processing",
		}
		json.NewEncoder(w).Encode(response)
	})

	mux.HandleFunc("GET /api/job/{id}", func(w http.ResponseWriter, r *http.Request) {
		jobID := r.PathValue("id")
		if jobID == "" {
			http.Error(w, "Job ID is required", http.StatusBadRequest)
			return
		}

		job, exists := GetJob(jobID)
		if !exists {
			http.Error(w, "Job not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(job); err != nil {
			log.Printf("Error encoding job response: %v", err)
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		}
	})

	go http.ListenAndServe(":9090", mux)

	go func() {
		for range queueTicker.C {
			CleanupDirectory(QUEUE_DIR)
		}
	}()
	for range doneTicker.C {
		CleanupDirectory(DONE_DIR)
	}
}
