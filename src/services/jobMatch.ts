//? Data
import { skillTerms } from "../data/skillTerms"
import type { SkillTerm } from "../data/skillTerms"

//? Model
import { documentText } from "../model/document"
import type { CvDocument, Id } from "../model/types"

const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/**
 * One spelling as a pattern fragment, tolerant of a plural and of however the
 * ad wrapped its lines: "Docker Compose" split over two lines still means
 * Compose, and "full stack" is "full-stack" is "full-\nstack".
 */
const body = (term: string) =>
  `${escape(term).replace(/[\s-]+/g, "[\\s-]+")}${/[a-z0-9]$/i.test(term) ? "s?" : ""}`

/**
 * What counts as the edge of a term. Word boundaries are no use here: half of
 * this vocabulary ends in punctuation (`C#`, `Node.js`, `SSL/TLS`), so the
 * edges are checked against alphanumerics instead.
 */
const edgeOf = (strict: boolean) => (strict ? "[^a-zA-Z0-9]" : "[^a-z0-9]")

/**
 * Whole word only. The leading edge is spelled out rather than written as a
 * lookbehind, which older Safari throws on, and a throw here would take the
 * whole panel down on the first keystroke.
 */
function mentions(text: string, term: string, strict: boolean): boolean {
  const edge = edgeOf(strict)
  const pattern = new RegExp(
    `(^|${edge})${body(term)}(${edge}|$)`,
    strict ? "" : "i",
  )
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
  /**
   * Every spelling the ad asked for, ready to pick those words out of the CV
   * itself. One pattern per case rule, since a strict term cannot share flags
   * with a loose one.
   */
  askedPatterns: RegExp[]
  /** Covered over asked, or 0 when the ad names nothing recognisable. */
  coverage: number
}

const EMPTY: OfferMatch = {
  covered: [],
  missing: [],
  matchedLines: new Set(),
  askedPatterns: [],
  coverage: 0,
}

function askedPatterns(terms: SkillTerm[]): RegExp[] {
  const patterns: RegExp[] = []
  for (const strict of [true, false]) {
    const group = terms.filter((term) => (term.strict === true) === strict)
    if (group.length === 0) continue

    const edge = edgeOf(strict)
    // Longest first, because alternation takes the first branch that fits and
    // "Docker" would otherwise claim the start of "Docker Compose".
    const bodies = group
      .flatMap((term) => [term.label, ...(term.aliases ?? [])])
      .map(body)
      .sort((a, b) => b.length - a.length)
    // The trailing edge is a lookahead so it is not consumed: two terms
    // separated by a single comma both have an edge to match against.
    patterns.push(
      new RegExp(
        `(^|${edge})(${bodies.join("|")})(?=${edge}|$)`,
        strict ? "g" : "gi",
      ),
    )
  }
  return patterns
}

/** A stretch of text, and whether the ad asked for those exact words. */
export type MarkedRun = {
  text: string
  marked: boolean
}

/**
 * Splits a line of the CV around the terms the ad named. Highlighting the
 * whole line instead would say nothing on a skills line, where one row lists
 * thirty tools and any single hit would light up all of them.
 */
export function markedRuns(
  text: string,
  patterns: readonly RegExp[],
): MarkedRun[] {
  const whole = [{ text, marked: false }]
  if (text === "" || patterns.length === 0) return whole

  const spans: [number, number][] = []
  for (const pattern of patterns) {
    for (const found of text.matchAll(pattern)) {
      const start = (found.index ?? 0) + found[1].length
      spans.push([start, start + found[2].length])
    }
  }
  if (spans.length === 0) return whole

  // Earliest first, and the longer span first when two start together, so a
  // term contained in another is swallowed by it rather than splitting it.
  spans.sort((a, b) => a[0] - b[0] || b[1] - a[1])

  const runs: MarkedRun[] = []
  let cursor = 0
  for (const [start, end] of spans) {
    if (end <= cursor) continue
    const from = Math.max(start, cursor)
    if (from > cursor) {
      runs.push({ text: text.slice(cursor, from), marked: false })
    }
    runs.push({ text: text.slice(from, end), marked: true })
    cursor = end
  }
  if (cursor < text.length) {
    runs.push({ text: text.slice(cursor), marked: false })
  }
  return runs
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
    askedPatterns: askedPatterns(asked),
    coverage: covered.length / asked.length,
  }
}
