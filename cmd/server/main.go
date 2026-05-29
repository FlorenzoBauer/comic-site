package main

import (
  "crypto/rand"
  "encoding/base64"
  "encoding/json"
  "fmt"
  "io"
  "log"
  "net/http"
  "os"
  "strconv"
  "strings"
  "time"
  "database/sql"

  "comic-site/internal/database"
  "comic-site/internal/models"
  "comic-site/internal/service"

  "github.com/go-chi/chi/v5"
  "github.com/go-chi/chi/v5/middleware"
  "github.com/go-chi/cors"
  "github.com/joho/godotenv"
  "golang.org/x/crypto/bcrypt"
)

func main() {
  godotenv.Load()
  database.Connect()

  port := os.Getenv("PORT")
  if port == "" {
    port = "8080"
  }

  r := chi.NewRouter()

  r.Use(middleware.Logger)
  r.Use(middleware.Recoverer)
  r.Use(cors.Handler(cors.Options{
    AllowedOrigins:   []string{"http://localhost:5173", "https://comic-site-fe-production.up.railway.app"},
    AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization"},
    ExposedHeaders:   []string{"Set-Cookie"},
    AllowCredentials: true,
  }))

  r.Route("/api", func(r chi.Router) {

    // --- OPEN AUTHENTICATION ENDPOINTS ---
    r.Post("/login", LoginHandler)
    r.Post("/logout", LogoutHandler) // FIXED: This was missing from the router!
    r.Get("/auth/status", AuthStatusHandler)

    // --- PUBLIC IMAGE PROXY ---
    // Left outside so standard <img> tags can resolve assets across origins easily
    r.Get("/proxy-image", func(w http.ResponseWriter, r *http.Request) {
      targetURL := r.URL.Query().Get("url")
      if targetURL == "" {
        return
      }

      client := &http.Client{Timeout: 10 * time.Second}
      req, _ := http.NewRequest("GET", targetURL, nil)
      req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
      req.Header.Set("Referer", "https://www.google.com/")

      resp, err := client.Do(req)
      if err != nil {
        http.Error(w, "FETCH_FAILED", 500)
        return
      }
      defer resp.Body.Close()

      w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
      io.Copy(w, resp.Body)
    })

    // --- FULLY SECURED VAULT ROUTE GROUP ---
    r.Group(func(r chi.Router) {
      r.Use(adminMiddleware) // Forces active session cookie validation for all endpoints below

				r.Post("/import-json", func(w http.ResponseWriter, r *http.Request) {
    // 1. Path to your new collectibles JSON
    filePath := "/Users/florenzobauer/personalprojects/comic-site/cmd/server/comics/cleaned_collectibles.json"

    fileData, err := os.ReadFile(filePath)
    if err != nil {
        http.Error(w, "File not found", 500)
        return
    }

    // 2. Unmarshal into Collectable slice
    var items []models.Collectable
    if err := json.Unmarshal(fileData, &items); err != nil {
        log.Printf("❌ JSON PARSE ERROR: %v", err)
        http.Error(w, "Failed to parse JSON", 400)
        return
    }

    // 3. Insert into collectables table
    tx := database.DB.MustBegin()
    for _, c := range items {
        query := `INSERT INTO collectables (item, type, maker, place_of_publication, writer, date, cover_price, category, language, notes, condition, pages, shelf, location) 
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`
        
        _, err := tx.Exec(query, c.Item, c.Type, c.Maker, c.PlaceOfPublication, c.Writer, c.Date, c.CoverPrice, c.Category, c.Language, c.Notes, c.Condition, c.Pages, c.Shelf, c.Location)
        if err != nil {
            tx.Rollback()
            log.Printf("Import failed on %s: %v", c.Item, err)
            http.Error(w, "Database insertion failed", 500)
            return
        }
    }
    tx.Commit()

    w.WriteHeader(http.StatusCreated)
    w.Write([]byte(fmt.Sprintf("✅ Successfully imported %d items!", len(items))))
})
      // 1. SECURED ENHANCED SCRAPER
      r.Get("/scrape-image", func(w http.ResponseWriter, r *http.Request) {
        query := r.URL.Query().Get("q")
        number := r.URL.Query().Get("n")
        entryType := r.URL.Query().Get("type")

        if query == "" {
          http.Error(w, "Query Required", 400)
          return
        }

        rawResults := []string{
          fmt.Sprintf("https://placehold.jp/24/2563eb/ffffff/300x450.png?text=%s+No.%s", query, number),
          "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=400",
        }

        var proxiedResults []string
        for _, url := range rawResults {
          proxiedResults = append(proxiedResults, fmt.Sprintf("http://localhost:8080/api/proxy-image?url=%s", url))
        }

        response := map[string]interface{}{"images": proxiedResults}

        if entryType == "comic" {
          response["suggested_price"] = 35.00
          if strings.Contains(strings.ToLower(query), "spider-man") && number == "300" {
            response["suggested_price"] = 1250.00
          }
          response["publisher"] = "Marvel Comics"
          response["writer"] = "Stan Lee"
        } else {
          response["maker"] = "Hasbro"
          response["category"] = "Action Figures"
          response["cover_price"] = "19.99"
        }

        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(response)
      })

      // 2. SECURED READ ROUTES
      r.Get("/comics", func(w http.ResponseWriter, r *http.Request) {
        // FIXED: Extract the search query and apply it to the SQL statement
        search := r.URL.Query().Get("search")
        var comics []models.Comic
        
        if search != "" {
          // ILIKE is used for Postgres case-insensitive searches
          database.DB.Select(&comics, "SELECT * FROM comics WHERE title ILIKE $1 ORDER BY title ASC", "%"+search+"%")
        } else {
          database.DB.Select(&comics, "SELECT * FROM comics ORDER BY title ASC")
        }
        
        json.NewEncoder(w).Encode(comics)
      })
      
      r.Get("/comics/{id}", func(w http.ResponseWriter, r *http.Request) {
        var c models.Comic
        err := database.DB.Get(&c, "SELECT * FROM comics WHERE id=$1", chi.URLParam(r, "id"))
        if err != nil {
          http.Error(w, "Not Found", 404)
          return
        }
        json.NewEncoder(w).Encode(c)
      })

      r.Get("/collectables", func(w http.ResponseWriter, r *http.Request) {
        // FIXED: Extract the search query and apply it to the SQL statement
        search := r.URL.Query().Get("search")
        var items []models.Collectable
        
        if search != "" {
          database.DB.Select(&items, "SELECT * FROM collectables WHERE item ILIKE $1 ORDER BY item ASC", "%"+search+"%")
        } else {
          database.DB.Select(&items, "SELECT * FROM collectables ORDER BY item ASC")
        }
        
        json.NewEncoder(w).Encode(items)
      })
      
      r.Get("/collectables/{id}", func(w http.ResponseWriter, r *http.Request) {
        var c models.Collectable
        err := database.DB.Get(&c, "SELECT * FROM collectables WHERE id=$1", chi.URLParam(r, "id"))
        if err != nil {
          http.Error(w, "Not Found", 404)
          return
        }
        json.NewEncoder(w).Encode(c)
      })

      // 3. SECURED DATA MUTATION/WRITE ACTIONS
      r.Post("/upload", handleUpload)

      r.Delete("/{type}/{id}", func(w http.ResponseWriter, r *http.Request) {
        table := chi.URLParam(r, "type")
        id := chi.URLParam(r, "id")

        if table != "comics" && table != "collectables" {
          log.Printf("❌ REJECTED: Invalid table name [%s]", table)
          http.Error(w, "INVALID_RESOURCE", 400)
          return
        }

        query := fmt.Sprintf("DELETE FROM %s WHERE id=$1", table)
        result, err := database.DB.Exec(query, id)
        if err != nil {
          log.Printf("❌ DB_ERROR: %v", err)
          http.Error(w, "DATABASE_ERROR", 500)
          return
        }

        rows, _ := result.RowsAffected()
        log.Printf("✅ SUCCESS: %d record(s) purged.", rows)
        w.Write([]byte("DELETED"))
      })

      r.Put("/comics/{id}", func(w http.ResponseWriter, r *http.Request) {
        var c models.Comic
        json.NewDecoder(r.Body).Decode(&c)
        query := `UPDATE comics SET title=$1, number=$2, publisher=$3, writer=$4, online_price=$5, condition=$6, notes=$7, language=$8, owner=$9, online_cgc=$10, place_of_publication=$11, pages=$12, tags=$13, category=$14, date=$15, cover_price=$16, value_based_on=$17 WHERE id=$18`
        database.DB.Exec(query, c.Title, c.Number, c.Publisher, c.Writer, c.OnlinePrice, c.Condition, c.Notes, c.Language, c.Owner, c.OnlineCGC, c.PlaceOfPublication, c.Pages, c.Tags, c.Category, c.Date, c.CoverPrice, c.ValueBasedOn, chi.URLParam(r, "id"))
        w.Write([]byte("COMMIT_SUCCESSFUL"))
      })

      r.Put("/collectables/{id}", func(w http.ResponseWriter, r *http.Request) {
        var c models.Collectable
        json.NewDecoder(r.Body).Decode(&c)
        query := `UPDATE collectables SET item=$1, maker=$2, shelf=$3, location=$4, condition=$5, notes=$6, category=$7, language=$8, type=$9, place_of_publication=$10, date=$11, cover_price=$12, cover_type=$13, pages=$14, writer=$15, owner=$16 WHERE id=$17`
        database.DB.Exec(query, c.Item, c.Maker, c.Shelf, c.Location, c.Condition, c.Notes, c.Category, c.Language, c.Type, c.PlaceOfPublication, c.Date, c.CoverPrice, c.CoverType, c.Pages, c.Writer, "Vault Primary", chi.URLParam(r, "id"))
        w.Write([]byte("COMMIT_SUCCESSFUL"))
      })
    })
  })

  log.Printf("🚀 Museum Vault Server Running on: http://localhost:%s", port)
  log.Fatal(http.ListenAndServe(":"+port, r))
}

// --- NEW AUTHENTICATION LAYER FUNCTIONALITIES ---

func generateToken() string {
  b := make([]byte, 32)
  rand.Read(b)
  return base64.URLEncoding.EncodeToString(b)
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
    var credentials struct {
        Username string `json:"username"`
        Password string `json:"password"`
    }

    if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil {
        http.Error(w, "Bad Request", http.StatusBadRequest)
        return
    }

    var user struct {
        ID           int    `db:"id"`
        PasswordHash string `db:"password_hash"`
    }

    // Fetch BOTH in one query. This is more efficient and safer.
    err := database.DB.Get(&user, "SELECT id, password_hash FROM users WHERE username = $1", credentials.Username)
    
    if err != nil {
        if err == sql.ErrNoRows {
            log.Printf("❌ ERROR: User '%s' NOT FOUND in the DB connected to Go", credentials.Username)
        } else {
            log.Printf("❌ ERROR: Database Query Error: %v", err)
        }
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // Verify Password
    err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(credentials.Password))
    if err != nil {
        log.Printf("❌ ERROR: Password mismatch for '%s'", credentials.Username)
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // Generate Token
    token := generateToken()
    expiresAt := time.Now().Add(48 * time.Hour)

    _, err = database.DB.Exec("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)", token, user.ID, expiresAt)
    if err != nil {
        log.Printf("❌ ERROR: Failed to insert session: %v", err)
        http.Error(w, "Session creation failed", http.StatusInternalServerError)
        return
    }

    http.SetCookie(w, &http.Cookie{
        Name:     "session_token",
        Value:    token,
        Expires:  expiresAt,
        HttpOnly: true,
        Path:     "/",
        SameSite: http.SameSiteLaxMode,
        Secure:   false,
    })

    w.Header().Set("Content-Type", "application/json")
    w.Write([]byte(`{"authenticated": true}`))
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
  cookie, err := r.Cookie("session_token")
  if err == nil {
    // Remove session from DB
    database.DB.Exec("DELETE FROM sessions WHERE token = $1", cookie.Value)
  }

  // Clear the cookie in the browser
  http.SetCookie(w, &http.Cookie{
    Name:     "session_token",
    Value:    "",
    Expires:  time.Unix(0, 0),
    HttpOnly: true,
    Path:     "/",
  })

  w.Header().Set("Content-Type", "application/json")
  w.Write([]byte(`{"message": "logged out"}`))
}

func AuthStatusHandler(w http.ResponseWriter, r *http.Request) {
  cookie, err := r.Cookie("session_token")
  if err != nil {
    w.Header().Set("Content-Type", "application/json")
    w.Write([]byte(`{"authenticated": false}`))
    return
  }

  var count int
  err = database.DB.Get(&count, "SELECT COUNT(*) FROM sessions WHERE token = $1 AND expires_at > NOW()", cookie.Value)
  if err != nil || count == 0 {
    w.Header().Set("Content-Type", "application/json")
    w.Write([]byte(`{"authenticated": false}`))
    return
  }

  w.Header().Set("Content-Type", "application/json")
  w.Write([]byte(`{"authenticated": true}`))
}

func adminMiddleware(next http.Handler) http.Handler {
  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    cookie, err := r.Cookie("session_token")
    if err != nil {
      http.Error(w, "DENIED", http.StatusUnauthorized)
      return
    }

    var count int
    err = database.DB.Get(&count, "SELECT COUNT(*) FROM sessions WHERE token = $1 AND expires_at > NOW()", cookie.Value)
    if err != nil || count == 0 {
      http.Error(w, "DENIED", http.StatusUnauthorized)
      return
    }

    next.ServeHTTP(w, r)
  })
}

func handleUpload(w http.ResponseWriter, r *http.Request) {
  r.ParseMultipartForm(10 << 20)
  entryType := r.FormValue("entry_type")
  var imgURL string

  webURL := r.FormValue("web_image_url")
  if webURL != "" {
    imgURL = webURL
  } else {
    file, handler, err := r.FormFile("image")
    if err == nil {
      defer file.Close()
      tempPath := "./" + handler.Filename
      tempFile, _ := os.Create(tempPath)
      io.Copy(tempFile, file)
      tempFile.Close()
      imgURL, _ = service.UploadImage(tempPath)
      os.Remove(tempPath)
    }
  }

  if entryType == "comic" {
    price, _ := strconv.ParseFloat(r.FormValue("online_price"), 64)
    pages, _ := strconv.Atoi(r.FormValue("pages"))
    query := `INSERT INTO comics (title, number, publisher, writer, online_price, tags, image_url, condition, notes, owner, pages, language, category, date, cover_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`
    database.DB.Exec(query, r.FormValue("title"), r.FormValue("number"), r.FormValue("publisher"), r.FormValue("writer"), price, r.FormValue("tags"), imgURL, r.FormValue("condition"), r.FormValue("notes"), r.FormValue("owner"), pages, r.FormValue("language"), r.FormValue("category"), r.FormValue("date"), r.FormValue("cover_price"))
  } else {
    pages, _ := strconv.Atoi(r.FormValue("pages"))
    query := `INSERT INTO collectables (item, type, maker, shelf, location, condition, notes, image_url, owner, country, category, language, pages, date, cover_price, place_of_publication) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`
    database.DB.Exec(query, r.FormValue("item"), r.FormValue("type"), r.FormValue("maker"), r.FormValue("shelf"), r.FormValue("location"), r.FormValue("condition"), r.FormValue("notes"), imgURL, r.FormValue("owner"), r.FormValue("country"), r.FormValue("category"), r.FormValue("language"), pages, r.FormValue("date"), r.FormValue("cover_price"), r.FormValue("place_of_publication"))
  }

  w.WriteHeader(http.StatusCreated)
}