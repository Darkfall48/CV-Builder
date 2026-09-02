---
name: verify-cv-builder-ui
description: Verifies the CV Builder in the browser across editing, page fill, DOCX export, locales, document RTL, and the narrow layout. Use after changing the editor, preview, export, or locales.
---

# Verify CV Builder UI

A single screenshot is not enough. The app has two renderers that must agree, so looking at the preview alone proves nothing about the file.

## Minimum path

1. **Desktop ≥1280×800**: two columns, the sheet in its own. Only the sheet scrolls — the export bar stays put while the editor is scrolled.
2. **Edit**: type in a section, hide an item, reorder two. The preview follows and the fill gauge moves. Push past 100%: the page-limit rule appears across the sheet.
3. **Export**: download the `.docx` and open it. Margins, bullet glyphs, underlines, and gaps match the preview. This is the step that catches a style change applied on one side only.
4. **Interface locale**: `EN` → `FR` → `עב`. Chrome updates, `lang` and `dir` follow, Hebrew is RTL with no clipped controls.
5. **Document direction**: switch the document to RTL while the interface stays in English. The sheet mirrors; the frame around it stays LTR and the scale still anchors on the same edge.
6. **Below `$break-split` (1100px)**: the editor takes the width, the export bar docks to the bottom of the viewport, and the fill gauge and Download button both stay visible side by side.
7. **Persistence**: reload. The document comes back. Then check "Load example" and "Reset" both land where they should.
8. **Keyboard**: tab through the header, one section's controls, and the download button. With `prefers-reduced-motion`: no large motion.

## If something breaks

Fix it and re-run the same path before stopping. If the break was in the export, also re-read `npm run smoke:docx`.
