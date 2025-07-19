# InkWize

InkWize is a comic discovery and reading list web app powered by the Comic Vine API. It allows users to search, browse, and manage their favorite comics, get recommendations, and view detailed comic info—all with a beautiful, modern UI.

## Features
- **Search Comics:** Find comics by title, author, or genre using Comic Vine's vast database.
- **Recommendations:** Get personalized comic recommendations based on your reading lists.
- **Reading List:** Track comics you're currently reading, favorites, and up next.
- **Comic Info:** View detailed information and covers for each comic.
- **User Profile:** Demo profile with random comic-related avatar and stats.
- **Dark Mode:** Toggle between light and dark themes.

## Setup & Installation

1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd InkWize
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Start the server:**
   ```sh
   node server.js
   ```
   The server will run at [http://localhost:3100](http://localhost:3100).

4. **Open the app:**
   - Visit [http://localhost:3100](http://localhost:3100) in your browser.

## Development Notes
- **Backend:**
  - `server.js` serves static HTML and proxies Comic Vine API requests.
  - Endpoints: `/api/comics`, `/api/search`, `/api/comic/:id`, `/api/auth/*`.
  - Only English comics are shown by default.
- **Frontend:**
  - Main UI in `InkWize.html` and related HTML files.
  - Profile section is demo-only and generates random data on each load.
  - All navigation and UI logic is handled client-side with vanilla JS.
- **Testing:**
  - Run `node test-api.js` to test the `/api/comics` endpoint.

## Environment Variables
- You can set a custom Comic Vine API key in a `.env` file:
  ```env
  COMICVINE_API_KEY=your_api_key_here
  ```
  The app uses a public demo key by default.

## License
This project is for educational/demo purposes only. Comic data and images are provided by [Comic Vine](https://comicvine.gamespot.com/). 