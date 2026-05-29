package database

import (
	"log"
	"os"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

var DB *sqlx.DB

func Connect() {
	dsn := os.Getenv("DATABASE_URL")
	var err error
	DB, err = sqlx.Connect("postgres", dsn)
	if err != nil {
		log.Fatalf("❌ Database connection failed: %v", err)
	}
	log.Println("✅ Database Connected")
}
