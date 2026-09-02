---
name: commit-cv-builder
description: Writes CV Builder git commits in the project subject format. Use only when the user asks to commit CV Builder changes or invokes /commit-cv-builder.
disable-model-invocation: true
---

# Commit CV Builder

## Before anything else

Run `pre-commit-review-cv-builder` on the current diff. If it is not ready, stop, apply only the corrections the user accepts, and re-run the review. Do not propose a commit title until the verdict is **Ready to commit: yes**.

Never run `git commit` until the user has explicitly approved. First propose the title, then ask which option they want.

## Approval (required)

Present the proposed subject, then ask:

1. **Title only** — give the user the commit title and stop. They commit themselves.
2. **Agent commits** — wait for a clear yes, then create the commit with that title.

If they pick neither, or only say "ok" without choosing, ask again. Do not commit.

## Subject format

Do not use Conventional Commits (`feat:`, `fix:`).

```text
CV Builder - Frontend - <Area> - Implemented|Improved|Fixed|Updated|Enhanced|Migrated: <why>
```

| Verb        | When                               |
| ----------- | ---------------------------------- |
| Implemented | New behaviour, section, or panel   |
| Improved    | Existing behaviour, better UX      |
| Fixed       | Bug                                |
| Updated     | Copy, content, or alignment change |
| Enhanced    | Extra safety, a11y, or robustness  |
| Migrated    | Tooling or stack move              |

```text
CV Builder - Frontend - Export - Fixed: role dates set in bold with the title
CV Builder - Frontend - Languages - Implemented: one-line section for languages
CV Builder - Frontend - Export bar - Improved: gauge and download visible on narrow screens
```

## Rules

- One subject, one concern.
- Area is the section, component, or topic (e.g. `Export`, `Preview`, `Editor`, `Document model`, `Storage`, `Offer match`, `i18n`).
- The part after the colon is the why, not a file list.
- Never commit `.env` or secrets. `dist/`, `CVs/`, `*.docx`, and the smoke bundle are already ignored; never force-add them, and never commit a real CV.
