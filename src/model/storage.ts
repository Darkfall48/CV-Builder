//? Model
import { DOCUMENT_VERSION, newId } from "./document"
import type {
  CvDocument,
  CvEducationEntry,
  CvInlineSection,
  CvLine,
  CvRole,
  CvSection,
  CvSkillGroup,
  StyleId,
} from "./types"

const STORAGE_KEY = "cv-builder-document"

/**
 * The document is the only thing the app owns, and it lives in one browser
 * with no copy anywhere. So a stored value is never trusted: a half-written
 * entry or a document from a future version must degrade to a usable editor,
 * never to a blank screen.
 */

type Raw = Record<string, unknown>

const isObject = (value: unknown): value is Raw =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const str = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback

const bool = (value: unknown, fallback = true): boolean =>
  typeof value === "boolean" ? value : fallback

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const id = (value: unknown): string => (str(value) === "" ? newId() : str(value))

function readLine(raw: unknown): CvLine {
  const source = isObject(raw) ? raw : {}
  return {
    id: id(source.id),
    lead: str(source.lead),
    text: str(source.text),
    visible: bool(source.visible),
  }
}

function readRole(raw: unknown): CvRole {
  const source = isObject(raw) ? raw : {}
  return {
    id: id(source.id),
    title: str(source.title),
    company: str(source.company),
    period: str(source.period),
    location: str(source.location),
    bullets: list(source.bullets).map(readLine),
    visible: bool(source.visible),
  }
}

function readEducation(raw: unknown): CvEducationEntry {
  const source = isObject(raw) ? raw : {}
  return {
    id: id(source.id),
    period: str(source.period),
    title: str(source.title),
    school: str(source.school),
    visible: bool(source.visible),
  }
}

function readSkillGroup(raw: unknown): CvSkillGroup {
  const source = isObject(raw) ? raw : {}
  return {
    id: id(source.id),
    label: str(source.label),
    items: str(source.items),
    visible: bool(source.visible),
  }
}

function readSection<T>(
  raw: unknown,
  fallbackTitle: string,
  readItem: (item: unknown) => T,
): CvSection<T> {
  const source = isObject(raw) ? raw : {}
  return {
    title: str(source.title, fallbackTitle),
    visible: bool(source.visible),
    items: list(source.items).map(readItem),
  }
}

function readInlineSection(
  raw: unknown,
  fallbackTitle: string,
): CvInlineSection {
  const source = isObject(raw) ? raw : {}
  return {
    title: str(source.title, fallbackTitle),
    text: str(source.text),
    visible: bool(source.visible),
  }
}

function readStyleId(raw: unknown): StyleId {
  return raw === "classic" ? "classic" : "hud"
}

/** Normalises anything into a usable document, or null if it is not one. */
export function readDocument(raw: unknown): CvDocument | null {
  if (!isObject(raw)) return null

  const version = typeof raw.version === "number" ? raw.version : 0
  // A document saved by a newer build may hold sections this one cannot
  // render, and silently dropping them would be worse than refusing to open
  // it. Older ones need no migration step: every field below has a fallback,
  // so a v1 document simply arrives with an empty languages line.
  if (version > DOCUMENT_VERSION) return null

  const identity = isObject(raw.identity) ? raw.identity : {}

  return {
    version: DOCUMENT_VERSION,
    styleId: readStyleId(raw.styleId),
    dir: raw.dir === "rtl" ? "rtl" : "ltr",
    fileName: str(raw.fileName),
    identity: {
      name: str(identity.name),
      headline: str(identity.headline),
      email: str(identity.email),
      phone: str(identity.phone),
      location: str(identity.location),
      links: list(identity.links).map((link) => {
        const source = isObject(link) ? link : {}
        return {
          id: id(source.id),
          label: str(source.label),
          url: str(source.url),
        }
      }),
    },
    summary: readSection(raw.summary, "Summary", readLine),
    experience: readSection(raw.experience, "Experience", readRole),
    education: readSection(raw.education, "Education", readEducation),
    skills: readSection(raw.skills, "Skills", readSkillGroup),
    languages: readInlineSection(raw.languages, "Languages"),
    footnote: str(raw.footnote),
  }
}

export function loadDocument(): CvDocument | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return readDocument(JSON.parse(stored))
  } catch {
    // Blocked storage, or a value that is not JSON at all. Either way there is
    // nothing to restore and the caller starts fresh.
    return null
  }
}

export function saveDocument(doc: CvDocument): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc))
  } catch {
    // Private mode or a full quota. The document still works this session.
  }
}

export function clearStoredDocument(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do: the in-memory document is what the caller resets.
  }
}

/** Readable on purpose: the export doubles as a file the user can hand-edit. */
export function toJson(doc: CvDocument): string {
  return JSON.stringify(doc, null, 2)
}

export function fromJson(text: string): CvDocument | null {
  try {
    return readDocument(JSON.parse(text))
  } catch {
    return null
  }
}
