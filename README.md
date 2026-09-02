# CV-Builder

Builds a one-page CV in the browser and hands it back as a `.docx`. Vite + React + TypeScript + SCSS. English, French, and Hebrew (RTL). Hosted on GitHub Pages at <https://darkfall48.github.io/CV-Builder/>.

## Scripts

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run preview
npm run deploy     # build + publish the gh-pages branch
npm run smoke:docx # export the example document and dump its paragraphs
```

Push to `main` also deploys via `.github/workflows/deploy.yml`. In the GitHub repo, set Pages source to the `gh-pages` branch.
