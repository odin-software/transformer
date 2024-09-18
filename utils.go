package main

import (
	"fmt"
	"log"
	"os"
	"strings"

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
