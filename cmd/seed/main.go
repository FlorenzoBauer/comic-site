package main

import (
	"log"
	"comic-site/internal/database"
	"comic-site/internal/models"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.Connect()

	// --- 1. CLEAN SLATE ---
	log.Println("🧹 Clearing old records...")
	database.DB.Exec("TRUNCATE comics, collectables RESTART IDENTITY CASCADE")

	// --- 2. SEED COMICS ---
	dummyComics := []models.Comic{
		{
			Title: "The Amazing Spider-Man", Number: strPtr("300"), Publisher: strPtr("Marvel"),
			PlaceOfPublication: strPtr("USA"), Writer: strPtr("David Michelinie"), Date: strPtr("1988-05-01"),
			CoverPrice: strPtr("$1.50"), Category: strPtr("Superhero"), Language: strPtr("English"),
			Notes: strPtr("First appearance of Venom."), Condition: strPtr("NM 9.4"), Pages: intPtr(36),
			OnlineCGC: strPtr("Yes"), OnlinePrice: floatPtr(550.00), ValueBasedOn: strPtr("eBay Sold"),
			Owner: strPtr("Vault_01"), Tags: strPtr("Key, Venom"), 
			ImageURL: strPtr("https://m.media-amazon.com/images/I/91SleOn2I6L.jpg"),
		},
		{
			Title: "Batman", Number: strPtr("404"), Publisher: strPtr("DC"),
			PlaceOfPublication: strPtr("USA"), Writer: strPtr("Frank Miller"), Date: strPtr("1987-02-01"),
			CoverPrice: strPtr("$0.75"), Category: strPtr("Superhero"), Language: strPtr("English"),
			Notes: strPtr("Year One Part 1."), Condition: strPtr("VF 8.0"), Pages: intPtr(32),
			OnlineCGC: strPtr("No"), OnlinePrice: floatPtr(65.00), ValueBasedOn: strPtr("MyComicShop"),
			Owner: strPtr("Vault_01"), Tags: strPtr("Batman, Year One"),
			ImageURL: strPtr("https://m.media-amazon.com/images/I/9103Y3Bf9UL.jpg"),
		},
	}

	for _, c := range dummyComics {
		query := `INSERT INTO comics (
			title, number, publisher, place_of_publication, writer, date, 
			cover_price, category, language, notes, condition, pages, 
			online_cgc, online_price, value_based_on, owner, tags, image_url
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`
		
		_, err := database.DB.Exec(query, 
			c.Title, c.Number, c.Publisher, c.PlaceOfPublication, c.Writer, c.Date,
			c.CoverPrice, c.Category, c.Language, c.Notes, c.Condition, c.Pages,
			c.OnlineCGC, c.OnlinePrice, c.ValueBasedOn, c.Owner, c.Tags, c.ImageURL,
		)
		if err != nil {
			log.Printf("❌ Comic Error (%s): %v", c.Title, err)
		}
	}

	// --- 3. SEED COLLECTABLES ---
	dummyCollectables := []models.Collectable{
		{
			Item: "Spawn Series 1 Action Figure", Type: strPtr("Action Figure"), Maker: strPtr("McFarlane Toys"),
			PlaceOfPublication: strPtr("Hong Kong"), Writer: strPtr("Todd McFarlane"), Date: strPtr("1994"),
			CoverPrice: strPtr("$25.00"), Category: strPtr("Toys"), Language: strPtr("English"),
			Notes: strPtr("Original 1994 release."), CoverType: strPtr("Clamshell"), Pages: intPtr(0),
			Condition: strPtr("MIB"), Shelf: strPtr("Shelf A"), Location: strPtr("Top Row"),
			ImageURL: strPtr("https://m.media-amazon.com/images/I/81x-Lz6pLHL.jpg"),
		},
	}

	for _, c := range dummyCollectables {
		query := `INSERT INTO collectables (
			item, type, maker, place_of_publication, writer, date, 
			cover_price, category, language, notes, cover_type, pages, 
			condition, shelf, location, image_url
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`
		
		_, err := database.DB.Exec(query,
			c.Item, c.Type, c.Maker, c.PlaceOfPublication, c.Writer, c.Date,
			c.CoverPrice, c.Category, c.Language, c.Notes, c.CoverType, c.Pages,
			c.Condition, c.Shelf, c.Location, c.ImageURL,
		)
		if err != nil {
			log.Printf("❌ Collectable Error (%s): %v", c.Item, err)
		}
	}

	log.Println("✅ DATABASE FULLY RE-BUILT AND SEEDED!")
}

// Helper functions to handle the Pointers in the models
func strPtr(s string) *string { return &s }
func intPtr(i int) *int       { return &i }
func floatPtr(f float64) *float64 { return &f }