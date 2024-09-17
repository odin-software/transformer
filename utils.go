package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/h2non/bimg"
)

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

func ConvertToWebP(file string) error {
	buffer, err := bimg.Read("files/queue/" + file)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
	}
	newImage, err := bimg.NewImage(buffer).Convert(bimg.WEBP)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
	}
	if bimg.NewImage(newImage).Type() != "webp" {
		fmt.Println("why")
	}
	strs := strings.Split(file, ".")
	return os.WriteFile("files/done/"+strs[0]+".webp", newImage, 0644)
}
