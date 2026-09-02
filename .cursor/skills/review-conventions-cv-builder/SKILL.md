---
name: review-conventions-cv-builder
description: Compares CV Builder changes to active project rules and skills and proposes convention fixes. Use after implementing a feature, or when the user asks to check conventions.
---

# Review CV Builder conventions

Read the bullets in `.cursor/rules/*.mdc` and `.cursor/skills/*/SKILL.md`, then check the diff against them.

## Check against

- Guardrails: Vite + React + TypeScript + SCSS, no Redux, no backend, no secrets, static `dist` on GitHub Pages, nothing leaving the browser, interface strings through i18n, no repo-authored CV data outside `exampleDocument`, English comments
- Architecture: layer boundaries (`model` / `services` / `cmps` / `hooks`), section edits through `sectionOps`, semantic HTML, kebab-case classes matching the SCSS nest, no CSS in TSX beyond `styleProperties()`, `//?` import order, propose generics (wait for approval)
- Document and export: metrics only in `docStyles.ts`, DOCX and preview reading the same object, text splitting shared from `model/document.ts`, `DOCUMENT_VERSION` bumped with a fallback in `storage.ts`, bullet glyph and its preview equivalent declared together
- SCSS: `@use` registered in `main.scss`, `pages/` vs `cmps/`, `&-` nesting, `$color-*` tokens, logical properties, `$break-narrow` / `$break-split` / `$break-wide`, nothing in `_cv-page.scss` that belongs to a style object
- i18n: three locales in step, interface direction and document direction kept independent, preview frame left LTR, protocol names untranslated

## Output

Propose diffs. Do not apply until the user approves.

```
Conventions
- [file] what is off → what to change (which rule/skill)
```

If the change already matches, say so in one line.
