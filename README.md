# CV Builder

Write a one-page CV in the browser and download it as a `.docx`. Vite + React + TypeScript + SCSS. English, French, and Hebrew for the interface; the document can be LTR or RTL on its own. Hosted on GitHub Pages at <https://darkfall48.github.io/CV-Builder/>.

Nothing you type leaves this browser: no account, no upload, no analytics. The file is built on the client and saved with a click. Drafts live in `localStorage` until you export or reset them.

## What it does

- Live A4 preview next to the editor, with a gauge for how much of page one is used.
- Two document styles, **Compact** and **Classic**, sharing one set of metrics for the preview and the Word file.
- Identity (name, headline, email, phone, location, links), summary, experience, education, skills, languages, and an optional closing note. Hide a field or a whole section without deleting it.
- Paste a job ad to mark covered and missing terms against a built-in vocabulary. No model, no network.
- ATS checks in the Job offer step: structure and content from the document, plus an optional parse of the generated `.docx` (opened again with JSZip). This reports parser risks, not a score from a named hiring system.
- Save and reopen a CV Builder JSON file. Load the example to see a full page, or start over.

Git ignores `CVs/`, `*.docx`, and the smoke bundle on purpose. Do not commit a real CV.

## Scripts

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run preview
npm run deploy     # build + publish the gh-pages branch
npm run smoke:docx # export the example document and dump its paragraphs
```

`smoke:docx` writes `smoke.docx` in the project root (gitignored). Read the dump; do not commit it.

## Deploy

Push to `main` also deploys via `.github/workflows/deploy.yml`. In the GitHub repo, set Pages source to the `gh-pages` branch. The production base path is `/CV-Builder/`.
