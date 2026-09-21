# SND P Blog

GitHub Pages blog with a browser publishing dashboard.

## Files

- `index.html` — homepage
- `article.html` — article page
- `admin.html` — publishing dashboard
- `app.js` — loads article list
- `article.js` — loads individual articles
- `admin.js` — publishes articles through GitHub API
- `style.css` — styling
- `posts/index.json` — article index
- `images/` — uploaded images

## Setup

1. Upload these files to your GitHub repository.
2. Enable GitHub Pages from the repository settings.
3. Confirm the branch is `main`.
4. Open `/admin.html`.
5. Create a fine-grained GitHub token limited to this repository with Contents read/write permission.
6. Enter the token only when publishing.

Never commit the token to the repository.
