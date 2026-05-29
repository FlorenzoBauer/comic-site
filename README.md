# ComicVault

ComicVault is a high-performance, full-stack inventory management platform designed for collectors to track, organize, and manage their comic books and collectible items. Built with a focus on data integrity, scalability, and a seamless user experience.

**Live Preview:** [https://comic-site-fe-production.up.railway.app/](https://comic-site-fe-production.up.railway.app/)
<img width="1761" height="790" alt="Screenshot 2026-05-29 at 3 51 36 PM" src="https://github.com/user-attachments/assets/e9382ba8-b225-4939-b42f-83574ba8920b" />
<img width="1594" height="791" alt="Screenshot 2026-05-29 at 3 53 43 PM" src="https://github.com/user-attachments/assets/7dd6b9dc-c9d0-4fb0-ae66-d6f13269dbb1" />


---

### Technologies
* **Backend:** Go (Golang)
* **Database:** PostgreSQL
* **Frontend:** React, Vite
* **Deployment:** Railway

---

### Features
* **Inventory Management:** Efficiently track and categorize large collections of comics and collectables.
* **Relational Data Integrity:** Utilizes optimized PostgreSQL schemas to handle complex data relationships.
* **Secure Authentication:** Implements custom session-based authorization for secure, private collection management.
* **Cloud-Native Deployment:** Seamlessly synced and hosted on Railway with a robust CI/CD pipeline.
* **Responsive UI:** A fast, reactive interface built with Vite to ensure quick search and data entry.

---

### Project Structure
* **`/BE`**: The Go backend handling API requests, database interactions, and authentication middleware.
* **`/FE`**: The React/Vite frontend providing the user dashboard and collection management tools.

---

### Getting Started

#### Prerequisites
* Go 1.x
* Node.js (for frontend)
* PostgreSQL

#### Installation
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd comic-site
   cd BE
go mod tidy
# Set your DATABASE_URL in environment variables
go run ./cmd/server/main.go



```
cd FE
npm install
npm run dev
```
