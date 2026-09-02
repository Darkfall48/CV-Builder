---
name: ship-cv-builder
description: Finishes a CV Builder change with locales, build, export parity, convention review, and UI verification. Use when the user asks to ship, finish, or wrap up a CV Builder change.
---

# Ship a CV Builder change

Run this after the code change works. Do not skip locales. Do not commit from this skill — `commit-cv-builder` runs only if the user asks.

## Checklist

```
- [ ] Interface copy in en, fr, and he (no hardcoded UI strings)
- [ ] Document schema change → DOCUMENT_VERSION bumped, storage.ts reads the field with a fallback
- [ ] Metrics in docStyles.ts only, and the export and preview read the same object
- [ ] SCSS partial registered in main.scss if styles were added
- [ ] npm run build (typecheck + build) passes
- [ ] npm run smoke:docx read, not just run, when the export changed
- [ ] /spellcheck-cv-builder + /review-conventions-cv-builder (propose, wait for approval)
- [ ] /verify-cv-builder-ui if the editor, preview, export, or locales changed
```

## Leftovers

`smoke.docx` and `scripts/smoke.bundle.mjs` are build artefacts. Git ignores them, but delete them anyway so the next run cannot read a stale dump.

## After

If the user wants a commit, tell them to run `/commit-cv-builder` (title only vs agent commit). Do not commit here.
