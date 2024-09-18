package main

import (
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

const QUEUE_DIR = "files/queue/"
const DONE_DIR = "files/done/"

func main() {
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

	mux.HandleFunc("POST /convert/{to}", func(w http.ResponseWriter, r *http.Request) {
		r.ParseMultipartForm(10 << 20)
		to := r.PathValue("to")
		file, header, err := r.FormFile("file")
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer file.Close()

		dst, err := os.Create("files/queue/" + header.Filename)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		if _, err := io.Copy(dst, file); err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		t := GetTypeFromString(to)
		filePath, err := ConvertTo(header.Filename, to, t)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Write([]byte(filePath))
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
