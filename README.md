Portfolio for kamoore (kamoore.net)

Overview
- Single-page static site (no build step required) served by GitHub Pages.
- Projects grid is fed from a generated JSON (`assets/data/projects.json`).
- `gh`-powered script included to fetch your private repos metadata and update the JSON.
- Custom domain configured via `CNAME` (kamoore.net).

Local Usage
1) Ensure GitHub CLI is authenticated: `gh auth status` (must have access to your private repos).
2) Generate projects data:
   - `bash scripts/fetch_projects.sh`
   - This runs `scripts/build_projects.mjs` which calls `gh repo list <you>` and writes `assets/data/projects.json`.
3) Enrich from READMEs (optional for better blurbs):
   - `node scripts/enrich_readmes.mjs`
   - Fetches each repo README and creates a concise `blurb` used by the UI.
3) Open `index.html` in a browser to preview locally.

Customizing
- Contact:
  - Update `CONFIG.contactEmail` and `CONFIG.githubProfile` in `assets/js/main.js`.
- Styling:
  - Edit palette and layout in `assets/css/styles.css`.
- Content:
  - Update About text directly in `index.html` (About section).

GitHub Pages
- Push `index.html`, `assets/`, `CNAME` to the default branch (e.g., `main`).
- In the repo Settings → Pages, set:
  - Source: Deploy from a branch
  - Branch: `main` (root)
- DNS: Point `kamoore.net` to GitHub Pages per docs, or use the CNAME record to your `username.github.io` if you prefer.

Updating Projects
- Re-run `bash scripts/fetch_projects.sh` whenever you add/update repos.
- Commit the updated `assets/data/projects.json`.

Notes
- The public JSON may include names and descriptions of private repositories. This is by design for a public summary; remove fields in `build_projects.mjs` if desired.
- No third-party analytics or trackers are included.
