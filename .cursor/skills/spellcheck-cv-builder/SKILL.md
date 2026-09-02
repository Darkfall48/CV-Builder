---
name: spellcheck-cv-builder
description: Checks spelling and typos in CV Builder changes (interface copy, locales, comments, README). Use after implementing a change, or when the user asks to proofread or check spelling.
---

# Spellcheck CV Builder

Review **changed files only**. List issues, then propose fixes. Do not apply edits until the user approves.

## Scope

- Interface strings: locale JSON (`en` / `fr` / `he`), `aria-label`, `title` attributes, buttons, hints, README
- Comments and JSDoc (English)

## Leave alone

- Proper nouns, protocol names, and product trademarks in copy (SAML, SCIM, SSO, LDAP, OIDC, Entra ID, Wingdings, and similar)
- The content of `exampleDocument`. It is the owner's real CV, worded to match a reference document; a typo there is a question for the user, not a fix to propose silently.

## Output

```
Spelling
- [file:line] current → proposed (why)
```

If nothing is wrong, say so in one line. If the user approves, apply only the accepted items.
