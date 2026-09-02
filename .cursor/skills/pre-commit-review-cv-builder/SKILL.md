---
name: pre-commit-review-cv-builder
description: Re-checks CV Builder changes before a commit (spelling, active rules, secrets, structure, export parity). Use when the user is about to commit, asks to review the diff, or invokes /pre-commit-review-cv-builder.
---

# Pre-commit review CV Builder

Gate before `/commit-cv-builder`. Do not commit from this skill.

## Steps

1. Follow `spellcheck-cv-builder` on the diff.
2. Follow `review-conventions-cv-builder` on the diff.
3. Check **import order** against the frontend rule: `//? Libraries` → `//? Content / i18n` → `//? Components` → `//? Model` → `//? Hooks` → `//? Config` → `//? Services` → `//? Icons` → `//? Styles`.
4. Check structure: one concern per file, SCSS partial registered in `main.scss`, no leftover `console` debug, no `.env` or secrets in the diff.
   `.gitignore` already keeps out `dist/`, `CVs/`, `*.docx`, and `scripts/smoke.bundle.mjs`. Confirm the diff neither loosens those entries nor force-adds a file they cover — a real CV in a public repo is the one mistake with no undo.
5. Confirm locale keys used in TSX exist in `en`, `fr`, and `he`.
6. If `CvDocument` changed shape: `DOCUMENT_VERSION` bumped, and `storage.ts` reads the new field with a fallback.
7. If the export or a document style changed: `npm run build` passes and `npm run smoke:docx` was read, not just run.
8. Confirm no personal data crept in outside `exampleDocument`, and no phone number or address inside it.

## Verdict

```
Pre-commit
- Spelling: OK | N issues
- Conventions: OK | N issues
- Order / structure / i18n keys: OK | N issues
- Document version / export parity: OK | N/A | N issues
- Ready to commit: yes | no
```

If **no**: list concrete corrections. Ask the user what to apply. Re-run this skill after fixes. Only then may `/commit-cv-builder` continue.

If **yes**: tell the user it is safe to run `/commit-cv-builder` (title only vs agent commit).
