# Chrome Version Downloader

A lightweight, single-page static site for downloading specific versions of Chrome, ChromeDriver, and Headless Shell. Data is fetched live from Google's official [Chrome for Testing](https://googlechromelabs.github.io/chrome-for-testing/) endpoints — no binaries are stored in this repository.

## Features

- **Latest versions** — Stable / Beta / Dev / Canary, read from the Chrome for Testing API.
- **Version search** — look up a specific version and get its official download link.
- **Platform & component selection** — Windows (x64 / x86), macOS (Intel / Apple Silicon), Linux (x64 / ARM64); Chrome, ChromeDriver, or Headless Shell.
- **Auto-update guide** — built-in instructions to disable Chrome's background auto-update so a pinned version is not replaced.

## How it works

| Endpoint | Purpose |
| --- | --- |
| `last-known-good-versions-with-downloads.json` | Latest version per channel (Stable / Beta / Dev / Canary) |
| `known-good-versions-with-downloads.json` | Full version index, lazily fetched when searching |

All download links point to Google's official storage (`storage.googleapis.com`).

## Access

Hosted on GitHub Pages at:

```
https://tienya.github.io/chrome-vault/
```

### Enable GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`, and save.

> The site uses relative asset paths and a `.nojekyll` file, so it works correctly under the `/<repo>/` subpath.

## Local development

Serve the directory with any static file server:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Project structure

```
chrome-vault/
├── index.html   # page structure
├── style.css    # styles
├── script.js    # data fetching, search, rendering
└── .nojekyll    # serve files as-is on GitHub Pages
```

## Disclaimer

Chrome is a trademark of Google LLC. This project only links to Google's official binaries and is not affiliated with Google.
