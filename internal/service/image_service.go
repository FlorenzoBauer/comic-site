package service

import (
	"context"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

func UploadImage(filePath string) (string, error) {
	ctx := context.Background()
	
	cld, err := cloudinary.NewFromURL(os.Getenv("CLOUDINARY_URL"))
	if err != nil {
		return "", err
	}

	// In v2, we call Upload directly using the Cloudinary instance
	resp, err := cld.Upload.Upload(ctx, filePath, uploader.UploadParams{
		Folder: "comics",
	})
	if err != nil {
		return "", err
	}

	return resp.SecureURL, nil
}