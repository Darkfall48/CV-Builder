//? Data
import { skillTerms } from "../data/skillTerms"
import type { SkillTerm } from "../data/skillTerms"

//? Model
import { documentText } from "../model/document"
import type { CvDocument, Id } from "../model/types"

const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/**
 * Whole word, tolerant of a plural and of however the ad wrapped its lines.
 * Word boundaries are no use here: half of this vocabulary ends in punctuation
 * (`C#`, `Node.js`, `SSL/TLS`), so the edges are checked against alphanumerics
 * instead. Spelled out rather than as a lookbehind, which older Safari throws
 * on, and a throw here would take the whole panel down on the first keystroke.
 */
function mentions(text: string, term: string, strict: boolean): boolean {
  const plural = /[a-z0-9]$/i.test(term) ? "s?" : ""
  // An ad that wrapped "Docker Compose" over two lines still means Compose,
  // and "full stack" is "full-stack" is "full-\nstack".
  const body = escape(term).replace(/[\s-]+/g, "[\\s-]+")
  const flags = strict ? "" : "i"
  const edge = strict ? "[^a-zA-Z0-9]" : "[^a-z0-9]"
  const pattern = new RegExp(`(^|${edge})${body}${plural}(${edge}|$)`, flags)
  return pattern.test(text)
}

/** Any spelling of a term counts as the term. */
function names(text: string, term: SkillTerm): boolean {
  const spellings = [term.label, ...(term.aliases ?? [])]
  return spellings.some((spelling) =>
    mentions(text, spelling, term.strict === true),
  )
}

export type OfferMatch = {
  /** Terms the ad asks for and the CV already answers. */
  covered: string[]
  /** Terms the ad asks for and the CV never mentions. */
  missing: string[]
  /** Lines that back at least one term the ad asked for. */
  matchedLines: ReadonlySet<Id>
  /** Covered over asked, or 0 when the ad names nothing recognisable. */
  coverage: number
}

const EMPTY: OfferMatch = {
  covered: [],
  missing: [],
  matchedLines: new Set(),
  coverage: 0,
}

/**
 * Reads a pasted job ad against the CV. Everything runs in the browser against
 * the bundled dictionary: no model, no network, and a result stated term by
 * term, which matters because a short name like `React` or `Express` does turn
 * up in prose that has nothing to do with the tool.
 */
export function matchOffer(offer: string, doc: CvDocument): OfferMatch {
  const ad = offer.trim()
  if (!ad) return EMPTY

  const asked = skillTerms.filter((term) => names(ad, term))
  if (asked.length === 0) return EMPTY

  const cv = documentText(doc)
  const covered: string[] = []
  const missing: string[] = []
  for (const term of asked) {
    if (names(cv, term)) covered.push(term.label)
    else missing.push(term.label)
  }

  // Which line answers which term is what turns the verdict into an edit: the
  // panel can point at the bullet that already says it, or at the empty space
  // where it does not.
  const matchedLines = new Set<Id>()
  const flag = (id: Id, text: string) => {
    if (asked.some((term) => names(text, term))) matchedLines.add(id)
  }

  for (const line of doc.summary.items) flag(line.id, `${line.lead} ${line.text}`)
  for (const role of doc.experience.items) {
    flag(role.id, `${role.title} ${role.company}`)
    for (const bullet of role.bullets) {
      flag(bullet.id, `${bullet.lead} ${bullet.text}`)
    }
  }
  for (const entry of doc.education.items) {
    flag(entry.id, `${entry.title} ${entry.school}`)
  }
  for (const group of doc.skills.items) {
    flag(group.id, `${group.label} ${group.items}`)
  }

  return {
    covered,
    missing,
    matchedLines,
    coverage: covered.length / asked.length,
  }
}
