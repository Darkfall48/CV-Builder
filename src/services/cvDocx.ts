//? Libraries
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  LevelFormat,
  LineRuleType,
  Packer,
  Paragraph,
  Tab,
  TabStopType,
  TextRun,
  UnderlineType,
} from "docx"
import type { INumberingOptions, IParagraphOptions, IRunOptions } from "docx"

//? Model
import {
  leadSpacer,
  periodPrefix,
  roleHeadRuns,
  skillRuns,
} from "../model/document"
import type { InlineRun } from "../model/document"
import type { CvDocument, CvLine } from "../model/types"

//? Services
import {
  DOC_RULE_COLOR,
  LINE_KINDS,
  documentStyle,
  textWidthMm,
} from "./docStyles"
import type { DocumentStyle, LineKind, LineStyle } from "./docStyles"

const mm = (value: number) => Math.round((value * 1440) / 25.4)
/** Word states type in half-points, so an odd size like 10.5pt is 21. */
const halfPt = (value: number) => Math.round(value * 2)
const twip = (points: number) => Math.round(points * 20)
/** Paragraph borders are measured in eighths of a point. */
const eighthPt = (points: number) => Math.round(points * 8)

// OOXML writes colours bare, CSS writes them with a hash.
const RULE_COLOR = DOC_RULE_COLOR.replace("#", "")
const INK = "000000"
const LINK_COLOR = "1155CC"

type Ctx = {
  style: DocumentStyle
  rtl: boolean
}

const nonEmpty = (value: string) => value.trim() !== ""

const underline = (on: boolean) =>
  on ? { type: UnderlineType.SINGLE } : undefined

function runOptions(ctx: Ctx, options: Partial<IRunOptions>): IRunOptions {
  return {
    font: ctx.style.font,
    color: INK,
    rightToLeft: ctx.rtl,
    ...options,
  } as IRunOptions
}

function paragraph(
  ctx: Ctx,
  children: (TextRun | ExternalHyperlink)[],
  options: Partial<IParagraphOptions> = {},
): Paragraph {
  return new Paragraph({
    bidirectional: ctx.rtl,
    ...options,
    // After the spread, or a caller setting only `after` would drop the line
    // spacing the style asked for.
    spacing: {
      line: Math.round(240 * ctx.style.lineHeight),
      lineRule: LineRuleType.AUTO,
      ...options.spacing,
    },
    children,
  } as IParagraphOptions)
}

// --- Lists -----------------------------------------------------------------

/**
 * One numbering definition per kind of list the style bullets. Word will not
 * take a glyph inline: to get a specific marker rather than whatever the
 * document theme hands out, the character and its symbol font have to be
 * declared here and referenced from the paragraph.
 */
function numbering(style: DocumentStyle): INumberingOptions {
  const config = []
  for (const kind of LINE_KINDS) {
    const { bullet, indentMm, hangingMm } = style[kind]
    if (!bullet) continue
    config.push({
      reference: `list-${kind}`,
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: bullet.char,
          alignment: AlignmentType.START,
          style: {
            run: {
              font: bullet.font,
              bold: bullet.bold,
              size: halfPt(style.size.bodyPt),
            },
            paragraph: {
              indent: { start: mm(indentMm), hanging: mm(hangingMm) },
            },
          },
        },
      ],
    })
  }
  return { config }
}

/** Marker and indent for one kind of line, in the form Word wants them. */
function lineLayout(
  kind: LineKind,
  style: DocumentStyle,
): Partial<IParagraphOptions> {
  const line = style[kind]
  if (!line.bullet) return { indent: { start: mm(line.indentMm) } }
  return {
    numbering: { reference: `list-${kind}`, level: 0 },
    indent: { start: mm(line.indentMm), hanging: mm(line.hangingMm) },
  }
}

// --- Runs ------------------------------------------------------------------

/**
 * A lead-in and its sentence, as one paragraph. Two runs rather than markup in
 * the text: the user types plain words, and the style decides how hard the
 * lead is set.
 */
function lineRuns(
  ctx: Ctx,
  line: CvLine,
  sizePt: number,
  kind: LineStyle,
): TextRun[] {
  const runs: TextRun[] = []
  if (nonEmpty(line.lead)) {
    runs.push(
      new TextRun(
        runOptions(ctx, {
          text: line.lead,
          bold: true,
          size: halfPt(sizePt),
          underline: underline(kind.underlineLead),
        }),
      ),
    )
  }
  if (nonEmpty(line.text)) {
    runs.push(
      new TextRun(
        runOptions(ctx, {
          text: `${leadSpacer(line.lead, line.text)}${line.text}`,
          bold: kind.boldBody,
          size: halfPt(sizePt),
        }),
      ),
    )
  }
  return runs
}

/** Pre-split text where only some stretches take the emphasis. */
function emphasised(
  ctx: Ctx,
  parts: InlineRun[],
  sizePt: number,
  emphasis: { bold: boolean; underline?: boolean },
): TextRun[] {
  return parts.map(
    (part) =>
      new TextRun(
        runOptions(ctx, {
          text: part.text,
          bold: part.strong && emphasis.bold,
          underline: underline(part.strong && emphasis.underline === true),
          size: halfPt(sizePt),
        }),
      ),
  )
}

// --- Sections --------------------------------------------------------------

function masthead(ctx: Ctx, doc: CvDocument): Paragraph[] {
  const { style } = ctx
  const alignment = style.masthead.centred
    ? AlignmentType.CENTER
    : AlignmentType.START

  // Collected before being built, because which line closes the block — and so
  // carries the rule under it — is only known once they are all in.
  type Line = {
    children: (TextRun | ExternalHyperlink)[]
    options: Partial<IParagraphOptions>
  }
  const lines: Line[] = []

  const nameRun = new TextRun(
    runOptions(ctx, {
      text: doc.identity.name,
      bold: true,
      size: halfPt(style.size.namePt),
    }),
  )

  // --- Contacts, as one run of separated parts ---
  const contact: (TextRun | ExternalHyperlink)[] = []
  const separator = () => {
    if (contact.length === 0) return
    contact.push(
      new TextRun(
        runOptions(ctx, {
          text: " | ",
          size: halfPt(style.size.contactPt),
          color: RULE_COLOR,
        }),
      ),
    )
  }

  if (nonEmpty(doc.identity.phone)) {
    contact.push(
      new TextRun(
        runOptions(ctx, {
          text: doc.identity.phone.trim(),
          bold: style.masthead.boldPhone,
          size: halfPt(style.size.contactPt),
        }),
      ),
    )
  }

  for (const value of [doc.identity.email, doc.identity.location]) {
    if (!nonEmpty(value)) continue
    separator()
    contact.push(
      new TextRun(
        runOptions(ctx, {
          text: value.trim(),
          size: halfPt(style.size.contactPt),
        }),
      ),
    )
  }

  for (const link of doc.identity.links) {
    const label = nonEmpty(link.label) ? link.label : link.url
    if (!nonEmpty(label)) continue
    separator()
    const run = new TextRun(
      runOptions(ctx, {
        text: label.trim(),
        size: halfPt(style.size.contactPt),
        color: nonEmpty(link.url) ? LINK_COLOR : INK,
        underline: underline(nonEmpty(link.url)),
      }),
    )
    contact.push(
      nonEmpty(link.url)
        ? new ExternalHyperlink({ children: [run], link: link.url.trim() })
        : run,
    )
  }

  // --- Lines of the header block ---
  // One line, with the contacts pushed to the far edge by a tab stop rather
  // than by the run of spaces the reference document used.
  if (style.masthead.inlineContact && contact.length > 0) {
    const tab = new TextRun(
      runOptions(ctx, {
        children: [new Tab()],
        size: halfPt(style.size.contactPt),
      }),
    )
    lines.push({
      children: [nameRun, tab, ...contact],
      options: {
        tabStops: [{ type: TabStopType.END, position: mm(textWidthMm(style)) }],
      },
    })
  } else {
    if (nonEmpty(doc.identity.name)) {
      lines.push({ children: [nameRun], options: { alignment } })
    }
    if (contact.length > 0) {
      lines.push({ children: contact, options: { alignment } })
    }
  }

  if (nonEmpty(doc.identity.headline)) {
    lines.push({
      children: [
        new TextRun(
          runOptions(ctx, {
            text: doc.identity.headline,
            size: halfPt(style.size.headlinePt),
          }),
        ),
      ],
      options: { alignment },
    })
  }

  if (lines.length === 0) return []

  // The rule and the gap close the header as a whole, so they go on its last
  // line — the name, the contacts or the headline, depending on what is filled.
  const closing: Partial<IParagraphOptions> = {
    spacing: {
      line: Math.round(240 * style.lineHeight),
      lineRule: LineRuleType.AUTO,
      after: twip(style.sectionGapPt),
    },
    border: style.masthead.rule
      ? {
          bottom: {
            style: BorderStyle.SINGLE,
            size: eighthPt(0.75),
            color: RULE_COLOR,
            space: 4,
          },
        }
      : undefined,
  }

  return lines.map(({ children, options }, index) =>
    paragraph(
      ctx,
      children,
      index === lines.length - 1 ? { ...options, ...closing } : options,
    ),
  )
}

function heading(ctx: Ctx, title: string): Paragraph {
  const { style } = ctx
  const text = style.heading.uppercase ? title.toLocaleUpperCase() : title
  return paragraph(
    ctx,
    [
      new TextRun(
        runOptions(ctx, {
          text,
          bold: true,
          size: halfPt(style.size.headingPt),
          underline: underline(style.heading.underline),
          characterSpacing: style.heading.letterSpacingPt
            ? twip(style.heading.letterSpacingPt)
            : undefined,
        }),
      ),
    ],
    {
      keepNext: true,
      spacing: {
        line: Math.round(240 * style.lineHeight),
        lineRule: LineRuleType.AUTO,
        after: twip(style.heading.rule ? 3 : 1),
      },
      border: style.heading.rule
        ? {
            bottom: {
              style: BorderStyle.SINGLE,
              size: eighthPt(0.5),
              color: RULE_COLOR,
              space: 2,
            },
          }
        : undefined,
    },
  )
}

function body(ctx: Ctx, doc: CvDocument): Paragraph[] {
  const { style } = ctx
  const out: Paragraph[] = []
  const gap = (points: number) => ({
    line: Math.round(240 * style.lineHeight),
    lineRule: LineRuleType.AUTO,
    after: twip(points),
  })

  if (doc.summary.visible) {
    const lines = doc.summary.items.filter(
      (item) => item.visible && (nonEmpty(item.lead) || nonEmpty(item.text)),
    )
    if (lines.length > 0) {
      if (nonEmpty(doc.summary.title)) out.push(heading(ctx, doc.summary.title))
      lines.forEach((line, index) => {
        out.push(
          paragraph(ctx, lineRuns(ctx, line, style.size.bodyPt, style.summary), {
            ...lineLayout("summary", style),
            spacing: gap(
              index === lines.length - 1
                ? style.sectionGapPt
                : style.paragraphGapPt,
            ),
          }),
        )
      })
    }
  }

  if (doc.experience.visible) {
    const roles = doc.experience.items.filter(
      (role) =>
        role.visible &&
        (nonEmpty(role.title) ||
          nonEmpty(role.company) ||
          role.bullets.some(
            (bullet) => bullet.visible && nonEmpty(bullet.text),
          )),
    )
    if (roles.length > 0) {
      if (nonEmpty(doc.experience.title)) {
        out.push(heading(ctx, doc.experience.title))
      }
      roles.forEach((role) => {
        const head = roleHeadRuns(role)
        if (head.length > 0) {
          out.push(
            paragraph(
              ctx,
              emphasised(ctx, head, style.size.bodyPt, style.roleHead),
              { keepNext: true, spacing: gap(style.paragraphGapPt) },
            ),
          )
        }

        const bullets = role.bullets.filter(
          (bullet) =>
            bullet.visible && (nonEmpty(bullet.lead) || nonEmpty(bullet.text)),
        )
        bullets.forEach((bullet, index) => {
          const isLast = index === bullets.length - 1
          out.push(
            paragraph(
              ctx,
              lineRuns(ctx, bullet, style.size.bodyPt, style.bullets),
              {
                ...lineLayout("bullets", style),
                // The gap closing a role is the same as the one closing a
                // section: the reference separates both with a blank line.
                spacing: gap(
                  isLast ? style.sectionGapPt : style.paragraphGapPt,
                ),
              },
            ),
          )
        })
      })
    }
  }

  if (doc.education.visible) {
    const entries = doc.education.items.filter(
      (entry) =>
        entry.visible && (nonEmpty(entry.title) || nonEmpty(entry.school)),
    )
    if (entries.length > 0) {
      if (nonEmpty(doc.education.title)) {
        out.push(heading(ctx, doc.education.title))
      }
      entries.forEach((entry, index) => {
        const runs: TextRun[] = []
        if (nonEmpty(entry.period)) {
          runs.push(
            new TextRun(
              runOptions(ctx, {
                text: periodPrefix(entry.period),
                size: halfPt(style.size.bodyPt),
              }),
            ),
          )
        }
        if (nonEmpty(entry.title)) {
          runs.push(
            new TextRun(
              runOptions(ctx, {
                text: entry.title.trim(),
                bold: style.education.bold,
                underline: underline(style.education.underline),
                size: halfPt(style.size.bodyPt),
              }),
            ),
          )
        }
        if (nonEmpty(entry.school)) {
          runs.push(
            new TextRun(
              runOptions(ctx, {
                text: runs.length > 0 ? `, ${entry.school}` : entry.school,
                size: halfPt(style.size.bodyPt),
              }),
            ),
          )
        }
        out.push(
          paragraph(ctx, runs, {
            indent: { start: mm(style.education.indentMm) },
            spacing: gap(
              index === entries.length - 1
                ? style.sectionGapPt
                : style.paragraphGapPt,
            ),
          }),
        )
      })
    }
  }

  if (doc.skills.visible) {
    const groups = doc.skills.items.filter(
      (group) =>
        group.visible && (nonEmpty(group.label) || nonEmpty(group.items)),
    )
    if (groups.length > 0) {
      if (nonEmpty(doc.skills.title)) out.push(heading(ctx, doc.skills.title))
      groups.forEach((group, index) => {
        out.push(
          paragraph(
            ctx,
            emphasised(
              ctx,
              skillRuns(group.label, group.items),
              style.size.bodyPt,
              { bold: true, underline: style.skills.underlineLead },
            ),
            {
              ...lineLayout("skills", style),
              spacing: gap(
                index === groups.length - 1
                  ? style.sectionGapPt
                  : style.paragraphGapPt,
              ),
            },
          ),
        )
      })
    }
  }

  if (doc.languages.visible && nonEmpty(doc.languages.text)) {
    const { inlineSection } = style
    const runs: TextRun[] = []
    if (nonEmpty(doc.languages.title)) {
      runs.push(
        new TextRun(
          runOptions(ctx, {
            text: doc.languages.title.trim(),
            bold: inlineSection.bold,
            underline: underline(inlineSection.underline),
            size: halfPt(
              inlineSection.headingSize
                ? style.size.headingPt
                : style.size.bodyPt,
            ),
          }),
        ),
      )
      // Outside the underline, so the rule under the label stops with the word.
      runs.push(
        new TextRun(
          runOptions(ctx, {
            children: [":", new Tab()],
            size: halfPt(
              inlineSection.headingSize
                ? style.size.headingPt
                : style.size.bodyPt,
            ),
          }),
        ),
      )
    }
    runs.push(
      new TextRun(
        runOptions(ctx, {
          text: doc.languages.text.trim(),
          size: halfPt(style.size.bodyPt),
        }),
      ),
    )
    out.push(
      paragraph(ctx, runs, {
        // A hanging indent of the same size gives the label the margin and
        // brings every wrapped line back to the values column.
        indent: {
          start: mm(inlineSection.valueOffsetMm),
          hanging: mm(inlineSection.valueOffsetMm),
        },
        spacing: gap(style.sectionGapPt),
      }),
    )
  }

  if (nonEmpty(doc.footnote)) {
    out.push(
      paragraph(
        ctx,
        [
          new TextRun(
            runOptions(ctx, {
              text: doc.footnote,
              italics: style.footnote.italic,
              size: halfPt(style.size.footnotePt),
              color: style.footnote.muted ? RULE_COLOR : INK,
            }),
          ),
        ],
        { spacing: gap(0) },
      ),
    )
  }

  return out
}

export function buildCvDocx(doc: CvDocument): Document {
  const style = documentStyle(doc.styleId)
  const ctx: Ctx = { style, rtl: doc.dir === "rtl" }

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: style.font, size: halfPt(style.size.bodyPt), color: INK },
        },
      },
    },
    numbering: numbering(style),
    sections: [
      {
        properties: {
          page: {
            size: {
              width: mm(style.page.widthMm),
              height: mm(style.page.heightMm),
            },
            margin: {
              top: mm(style.page.marginTopMm),
              bottom: mm(style.page.marginBottomMm),
              left: mm(style.page.marginStartMm),
              right: mm(style.page.marginEndMm),
            },
          },
        },
        children: [...masthead(ctx, doc), ...body(ctx, doc)],
      },
    ],
  })
}

export function renderCvDocx(doc: CvDocument): Promise<Blob> {
  return Packer.toBlob(buildCvDocx(doc))
}
