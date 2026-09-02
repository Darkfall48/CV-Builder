//? Model
import type { StyleId } from "../model/types"

/**
 * A document style, stated once and read twice: the DOCX renderer turns it
 * into OOXML, and the preview projects it onto the page as CSS custom
 * properties. Two consumers, one set of numbers, so what is on screen is what
 * lands in Word.
 *
 * Lengths are in millimetres and type sizes in points, which is how both Word
 * and CSS think about a printed page. The conversions to twips and half-points
 * live in the renderer, not here.
 */

/**
 * A list marker. Word takes a code point in a symbol font, which is the only
 * way to get a specific glyph rather than whatever the theme decides; the
 * browser cannot be trusted to have that font, so it gets the nearest real
 * Unicode character instead.
 */
export type BulletMarker = {
  /** Code point as the symbol font encodes it, for the DOCX. */
  char: string
  font: string
  bold: boolean
  /** Closest standard glyph, quoted for CSS `list-style-type`. */
  preview: string
}

/** Word's bullet gallery, in the three glyphs the reference document uses. */
const ARROWHEAD: BulletMarker = {
  char: "\uF0D8",
  font: "Wingdings",
  bold: false,
  preview: "➢",
}
const ROUND: BulletMarker = {
  char: "\uF0B7",
  font: "Symbol",
  bold: true,
  preview: "•",
}
const CHECKBOX: BulletMarker = {
  char: "\uF0FE",
  font: "Wingdings",
  bold: false,
  // The variation selector asks for the text glyph; without it a browser is
  // free to render the ballot box as a colour emoji.
  preview: "☑\uFE0E",
}
const PLAIN: BulletMarker = {
  char: "\uF0B7",
  font: "Symbol",
  bold: false,
  preview: "•",
}

/**
 * A horizontal rule. Word draws one as a paragraph border and only offers the
 * patterns in its own gallery, so the shape is stated as bands of ink and gap
 * rather than as a border keyword: the renderer picks the pattern that matches,
 * and the preview paints the same proportions as gradient stops.
 */
export type DocRule = {
  /** Thickness of the whole stack of bands, in points. */
  widthPt: number
  color: string
  /** Air between the text and the rule, in points. */
  gapPt: number
  /**
   * Ink and gap widths alternating, ink first, in any consistent unit. One
   * band is a plain line; five make the thin-thick-thin of the reference, in
   * the proportions Word draws it — half-width outer lines and medium gaps.
   */
  bands: number[]
}

/** How one kind of line is set. Summary, bullets and skills each get one. */
export type LineStyle = {
  /** Null for a line that is not a list item at all. */
  bullet: BulletMarker | null
  /** The whole line is bold, not only its lead-in. */
  boldBody: boolean
  underlineLead: boolean
  indentMm: number
  /** How far the marker sits back from the text it belongs to. */
  hangingMm: number
}

export type DocumentStyle = {
  id: StyleId
  /** Font name as Word resolves it; the preview stack starts with the same. */
  font: string
  previewFont: string
  page: {
    widthMm: number
    heightMm: number
    marginTopMm: number
    marginBottomMm: number
    marginStartMm: number
    marginEndMm: number
  }
  size: {
    namePt: number
    headlinePt: number
    contactPt: number
    headingPt: number
    bodyPt: number
    footnotePt: number
  }
  /** Multiple of single spacing, the way Word states it. */
  lineHeight: number
  /**
   * Height of the font's own line box, as a multiple of its point size. Word
   * multiplies `lineHeight` by this; CSS `line-height` does not, so without it
   * the preview would run about 15% shorter than the exported page and the
   * fill gauge would lie by a good four lines.
   */
  lineBox: number
  /** Blank space after a paragraph and after a whole section, in points. */
  paragraphGapPt: number
  sectionGapPt: number
  masthead: {
    centred: boolean
    /** Name and contacts share one line, contacts pushed to the far end. */
    inlineContact: boolean
    /**
     * Blank line opening the page, given as the size of the run that holds it,
     * which is how the reference document sets the name off the top margin.
     */
    leadPt: number
    /** Horizontal rule closing the header block. */
    rule: DocRule | null
    /**
     * How far short of the end margin the rule stops — and with it the
     * contacts, which ride a tab stop out to the same edge.
     */
    ruleInsetMm: number
    /** The phone number set bold, the way a CV meant to be called sets it. */
    boldPhone: boolean
    /** Separators between contacts set in the muted ink rather than in black. */
    mutedSeparator: boolean
  }
  heading: {
    uppercase: boolean
    underline: boolean
    /** Rule running the full text width under the heading. */
    rule: DocRule | null
    /** Air between the heading and the first line under it, in points. */
    gapPt: number
    letterSpacingPt: number
  }
  summary: LineStyle
  bullets: LineStyle
  skills: LineStyle
  /** Dates open the line plainly, so only the title itself is emphasised. */
  roleHead: { bold: boolean; underline: boolean }
  /**
   * A hanging block: the dates open at the margin and both the titles and a
   * wrapped line sit at `indentMm`, so the school never sits under a date and a
   * short year leaves its title level with the line above.
   */
  education: {
    bold: boolean
    underline: boolean
    indentMm: number
    hangingMm: number
  }
  /** A one-line section: label at the start, values in a second column. */
  inlineSection: {
    headingSize: boolean
    bold: boolean
    underline: boolean
    /** Where the values start, and where a wrapped line comes back to. */
    valueOffsetMm: number
  }
  footnote: {
    italic: boolean
    muted: boolean
    /** Set against the end margin, the way a closing aside reads. */
    alignEnd: boolean
    indentMm: number
    hangingMm: number
  }
}

const A4 = { widthMm: 210, heightMm: 297 }

/** Muted ink, shared by rules, separators and anything set quietly. */
export const DOC_RULE_COLOR = "#808080"

/** Word's own hyperlink colour, which the reference document inherits. */
export const DOC_LINK_COLOR = "#0563C1"

/** The accent the reference draws its header rule in. */
const DOC_ACCENT_COLOR = "#4472C4"

/**
 * The portfolio CV, measured off the reference document rather than guessed at.
 * Arial throughout, margins pared to the edge of what a printer will take, a
 * bulleted profile set entirely in bold, and underlines carrying every heading
 * and job title. Built to hold a full career on one page.
 *
 * From the reference: page margins 142 / 99 twips top and bottom and 306 / 254
 * at the sides, body 21 half-points, headings 22, name 32, line rule 300/240,
 * profile indented 284 with a matching hang, lists at 720 hanging 360,
 * education and the closing note hanging off 1418 and 1814.
 */
const hud: DocumentStyle = {
  id: "hud",
  font: "Arial",
  previewFont: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
  page: {
    ...A4,
    marginTopMm: 2.5,
    marginBottomMm: 1.75,
    marginStartMm: 5.4,
    marginEndMm: 4.5,
  },
  size: {
    namePt: 16,
    headlinePt: 11,
    contactPt: 11,
    headingPt: 11,
    bodyPt: 10.5,
    footnotePt: 10.5,
  },
  lineHeight: 1.25,
  lineBox: 1.15,
  paragraphGapPt: 0,
  // The reference separates sections with an empty paragraph carrying a 4pt
  // run, which comes out at 4 × 1.15 × 1.25 points of height.
  sectionGapPt: 5.75,
  masthead: {
    centred: false,
    inlineContact: true,
    leadPt: 5.5,
    // Drawn in the reference as a triple connector rather than a border, which
    // Word's own gallery matches with its thin-thick-thin medium gap.
    rule: {
      widthPt: 5,
      color: DOC_ACCENT_COLOR,
      gapPt: 0,
      bands: [0.5, 0.4, 1, 0.4, 0.5],
    },
    ruleInsetMm: 5.8,
    boldPhone: true,
    mutedSeparator: false,
  },
  heading: {
    uppercase: false,
    underline: true,
    rule: null,
    gapPt: 0,
    letterSpacingPt: 0,
  },
  // The profile is the one block a recruiter reads whole, so the reference
  // sets all four lines in bold and underlines only the opening claim.
  summary: {
    bullet: ARROWHEAD,
    boldBody: true,
    underlineLead: true,
    indentMm: 5,
    hangingMm: 5,
  },
  bullets: {
    bullet: ROUND,
    boldBody: false,
    underlineLead: false,
    indentMm: 12.7,
    hangingMm: 6.35,
  },
  skills: {
    bullet: CHECKBOX,
    boldBody: false,
    underlineLead: false,
    indentMm: 12.7,
    hangingMm: 6.35,
  },
  roleHead: { bold: true, underline: true },
  // The reference declares a 1418 twip indent but pads its dates with spaces, so
  // the titles actually land a little short of it; 22mm is where they sit. The
  // dates open at the margin and a wrapped line comes back to the titles.
  education: { bold: false, underline: true, indentMm: 22, hangingMm: 22 },
  // The reference hangs this line off a 1814 twip indent, so the label sits at
  // the margin and the values line up in a column of their own.
  inlineSection: {
    headingSize: true,
    bold: true,
    underline: true,
    valueOffsetMm: 32,
  },
  footnote: {
    italic: false,
    muted: false,
    alignEnd: true,
    indentMm: 32,
    hangingMm: 32,
  },
}

/**
 * The conventional counterpart: a serif face, a centred masthead and headings
 * that announce themselves with a rule. Roomier margins, nothing underlined,
 * so it reads as a letter rather than a datasheet.
 */
const classic: DocumentStyle = {
  id: "classic",
  font: "Georgia",
  previewFont: "Georgia, 'Times New Roman', serif",
  page: {
    ...A4,
    marginTopMm: 18,
    marginBottomMm: 16,
    marginStartMm: 20,
    marginEndMm: 20,
  },
  size: {
    namePt: 20,
    headlinePt: 11.5,
    contactPt: 9.5,
    headingPt: 10.5,
    bodyPt: 10,
    footnotePt: 8.5,
  },
  lineHeight: 1.2,
  lineBox: 1.14,
  paragraphGapPt: 2,
  sectionGapPt: 8,
  masthead: {
    centred: true,
    inlineContact: false,
    leadPt: 0,
    rule: null,
    ruleInsetMm: 0,
    boldPhone: false,
    mutedSeparator: true,
  },
  heading: {
    uppercase: true,
    underline: false,
    rule: { widthPt: 0.5, color: DOC_RULE_COLOR, gapPt: 2, bands: [1] },
    gapPt: 3,
    letterSpacingPt: 1.2,
  },
  summary: {
    bullet: null,
    boldBody: false,
    underlineLead: false,
    indentMm: 0,
    hangingMm: 0,
  },
  bullets: {
    bullet: PLAIN,
    boldBody: false,
    underlineLead: false,
    indentMm: 8,
    hangingMm: 4,
  },
  skills: {
    bullet: null,
    boldBody: false,
    underlineLead: false,
    indentMm: 0,
    hangingMm: 0,
  },
  roleHead: { bold: true, underline: false },
  education: { bold: true, underline: false, indentMm: 0, hangingMm: 0 },
  inlineSection: {
    headingSize: false,
    bold: true,
    underline: false,
    valueOffsetMm: 26,
  },
  footnote: {
    italic: true,
    muted: true,
    alignEnd: false,
    indentMm: 0,
    hangingMm: 0,
  },
}

export const DOCUMENT_STYLES: Record<StyleId, DocumentStyle> = { hud, classic }

export const STYLE_IDS = Object.keys(DOCUMENT_STYLES) as StyleId[]

export function documentStyle(id: StyleId): DocumentStyle {
  return DOCUMENT_STYLES[id] ?? hud
}

/** Height of the text column, which is what a one-page budget is measured in. */
export function usableHeightMm(style: DocumentStyle): number {
  return (
    style.page.heightMm - style.page.marginTopMm - style.page.marginBottomMm
  )
}

/** Width of the text column, which is where a right-aligned tab stop lands. */
export function textWidthMm(style: DocumentStyle): number {
  return style.page.widthMm - style.page.marginStartMm - style.page.marginEndMm
}

/** The three list kinds, so both renderers can walk them the same way. */
export const LINE_KINDS = ["summary", "bullets", "skills"] as const
export type LineKind = (typeof LINE_KINDS)[number]

const marker = (line: LineStyle) =>
  line.bullet ? `"${line.bullet.preview}"` : "none"
const weight = (bold: boolean) => (bold ? "700" : "400")

/**
 * A rule as a paint. The browser has no equivalent of Word's banded border
 * patterns, so the bands are laid out as hard gradient stops holding the same
 * proportions, which comes out the same thickness and the same shape.
 */
function ruleFill(rule: DocRule): string {
  const total = rule.bands.reduce((sum, band) => sum + band, 0)
  const stops: string[] = []
  let from = 0
  rule.bands.forEach((band, index) => {
    const to = from + (band / total) * 100
    const paint = index % 2 === 0 ? rule.color : "transparent"
    stops.push(`${paint} ${from.toFixed(2)}% ${to.toFixed(2)}%`)
    from = to
  })
  return `linear-gradient(to bottom, ${stops.join(", ")})`
}

/** The three properties a rule needs on the page, or nothing to draw. */
function ruleProperties(
  name: string,
  rule: DocRule | null,
): Record<string, string> {
  return {
    [`--doc-${name}-rule-size`]: `${rule ? rule.widthPt : 0}pt`,
    [`--doc-${name}-rule-gap`]: `${rule ? rule.gapPt : 0}pt`,
    [`--doc-${name}-rule-fill`]: rule ? ruleFill(rule) : "none",
  }
}

/**
 * The style as CSS custom properties. This is the one place the app writes an
 * inline style: the values are document data, not design tokens, and a
 * stylesheet cannot hold a set that grows with every new document style.
 * Everything the preview needs comes through here, so the sheet on screen and
 * the file in Word are driven by the same numbers.
 */
export function styleProperties(style: DocumentStyle): Record<string, string> {
  const { page, size, heading, masthead } = style

  const lines: Record<string, string> = {}
  for (const kind of LINE_KINDS) {
    const line = style[kind]
    lines[`--doc-${kind}-marker`] = marker(line)
    lines[`--doc-${kind}-marker-weight`] = weight(line.bullet?.bold ?? false)
    lines[`--doc-${kind}-weight`] = weight(line.boldBody)
    lines[`--doc-${kind}-indent`] = `${line.indentMm}mm`
    lines[`--doc-${kind}-lead-decoration`] = line.underlineLead
      ? "underline"
      : "none"
  }

  return {
    "--page-width": `${page.widthMm}mm`,
    "--page-height": `${page.heightMm}mm`,
    "--page-margin-block-start": `${page.marginTopMm}mm`,
    "--page-margin-block-end": `${page.marginBottomMm}mm`,
    "--page-margin-start": `${page.marginStartMm}mm`,
    "--page-margin-end": `${page.marginEndMm}mm`,
    "--doc-font": style.previewFont,
    "--doc-name-size": `${size.namePt}pt`,
    "--doc-headline-size": `${size.headlinePt}pt`,
    "--doc-contact-size": `${size.contactPt}pt`,
    "--doc-heading-size": `${size.headingPt}pt`,
    "--doc-body-size": `${size.bodyPt}pt`,
    "--doc-footnote-size": `${size.footnotePt}pt`,
    "--doc-line-height": `${style.lineHeight * style.lineBox}`,
    "--doc-paragraph-gap": `${style.paragraphGapPt}pt`,
    "--doc-section-gap": `${style.sectionGapPt}pt`,
    "--doc-rule-color": DOC_RULE_COLOR,
    "--doc-link-color": DOC_LINK_COLOR,
    "--doc-masthead-align": masthead.centred ? "center" : "start",
    ...ruleProperties("masthead", masthead.rule),
    "--doc-masthead-rule-inset": `${masthead.ruleInsetMm}mm`,
    "--doc-phone-weight": weight(masthead.boldPhone),
    "--doc-sep-color": masthead.mutedSeparator
      ? DOC_RULE_COLOR
      : "currentColor",
    "--doc-heading-transform": heading.uppercase ? "uppercase" : "none",
    "--doc-heading-decoration": heading.underline ? "underline" : "none",
    ...ruleProperties("heading", heading.rule),
    "--doc-heading-gap": `${heading.gapPt}pt`,
    "--doc-heading-tracking": `${heading.letterSpacingPt}pt`,
    ...lines,
    "--doc-role-decoration": style.roleHead.underline ? "underline" : "none",
    "--doc-role-weight": weight(style.roleHead.bold),
    "--doc-education-decoration": style.education.underline
      ? "underline"
      : "none",
    "--doc-education-weight": weight(style.education.bold),
    "--doc-education-indent": `${style.education.indentMm}mm`,
    "--doc-education-hanging": `${style.education.hangingMm}mm`,
    "--doc-inline-label-size": style.inlineSection.headingSize
      ? `${size.headingPt}pt`
      : `${size.bodyPt}pt`,
    "--doc-inline-label-weight": weight(style.inlineSection.bold),
    "--doc-inline-label-decoration": style.inlineSection.underline
      ? "underline"
      : "none",
    "--doc-inline-value-offset": `${style.inlineSection.valueOffsetMm}mm`,
    "--doc-footnote-style": style.footnote.italic ? "italic" : "normal",
    "--doc-footnote-color": style.footnote.muted
      ? DOC_RULE_COLOR
      : "currentColor",
    "--doc-footnote-align": style.footnote.alignEnd ? "end" : "start",
    "--doc-footnote-indent": `${style.footnote.indentMm}mm`,
    "--doc-footnote-hanging": `${style.footnote.hangingMm}mm`,
  }
}
