/**
 * The document the user writes. Unlike a portfolio, nothing here is authored
 * in the repo: every string below is typed in by whoever opens the app, so it
 * never goes through i18n. Only the interface around it is translated.
 */

export type Id = string

/** Which document style renders the export and the preview. */
export type StyleId = "hud" | "classic"

export type CvDirection = "ltr" | "rtl"

export type CvLink = {
  id: Id
  label: string
  url: string
}

export type CvIdentity = {
  name: string
  headline: string
  email: string
  phone: string
  location: string
  links: CvLink[]
}

/**
 * Most lines of a CV open on a few words that carry the whole line, and a
 * recruiter scanning the page reads only those. Splitting the lead from the
 * rest lets the document set it in bold without the user writing markup.
 */
export type CvLine = {
  id: Id
  lead: string
  text: string
  visible: boolean
}

export type CvRole = {
  id: Id
  title: string
  company: string
  period: string
  location: string
  bullets: CvLine[]
  visible: boolean
}

export type CvEducationEntry = {
  id: Id
  period: string
  title: string
  school: string
  visible: boolean
}

/** One paragraph of the skills section: a bold lead-in and its list. */
export type CvSkillGroup = {
  id: Id
  label: string
  items: string
  visible: boolean
}

/** A section carries its own heading, so the document needs no fixed wording. */
export type CvSection<T> = {
  title: string
  visible: boolean
  items: T[]
}

/**
 * A section short enough to sit on one line, heading and content side by side.
 * Languages are the case that earns it: three words of answer do not deserve
 * a heading of their own, and a CV sets them as a labelled line.
 */
export type CvInlineSection = {
  title: string
  text: string
  visible: boolean
}

export type CvDocument = {
  version: number
  styleId: StyleId
  /** Direction of the content, which need not match the interface locale. */
  dir: CvDirection
  fileName: string
  identity: CvIdentity
  summary: CvSection<CvLine>
  experience: CvSection<CvRole>
  education: CvSection<CvEducationEntry>
  skills: CvSection<CvSkillGroup>
  languages: CvInlineSection
  footnote: string
}
