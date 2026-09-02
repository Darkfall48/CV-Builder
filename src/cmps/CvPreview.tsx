//? Libraries
import { useTranslation } from "react-i18next"
import type { CSSProperties, ReactNode, RefObject } from "react"

//? Model
import {
  isDocumentEmpty,
  leadSpacer,
  periodLabel,
  periodPrefix,
  roleHeadRuns,
  skillRuns,
} from "../model/document"
import type { InlineRun } from "../model/document"
import type { CvDocument, CvLine } from "../model/types"

//? Hooks
import type { PreviewFit } from "../hooks/usePreviewFit"

//? Services
import { documentStyle, styleProperties } from "../services/docStyles"

type Props = {
  doc: CvDocument
  frameRef: RefObject<HTMLDivElement | null>
  pageRef: RefObject<HTMLElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  fit: PreviewFit
  isOver: boolean
}

const filled = (value: string) => value.trim() !== ""
const hasCopy = (line: CvLine) => filled(line.lead) || filled(line.text)

/**
 * A lead-in and its sentence. Whether the lead is underlined and whether the
 * rest is bold are both style decisions, so they arrive as CSS properties on
 * the list rather than as props here.
 */
function Line({ line }: { line: CvLine }) {
  return (
    <>
      {filled(line.lead) ? (
        <strong className="cv-doc-lead">{line.lead}</strong>
      ) : null}
      {leadSpacer(line.lead, line.text)}
      {line.text}
    </>
  )
}

function Lines({ kind, children }: { kind: string; children: ReactNode }) {
  return <ul className={`cv-doc-lines is-${kind}`}>{children}</ul>
}

/**
 * Pre-split text where only some stretches take the emphasis. Keyed by
 * position, which is stable here: the parts are a pure function of the text.
 */
function Emphasised({ parts }: { parts: InlineRun[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.strong ? (
          <strong key={index}>{part.text}</strong>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  )
}

/**
 * The document as it will print: A4 at its real width, in the fonts Word will
 * use, with the margins the style declares. It is not an illustration of the
 * export — it is the same numbers laid out by the browser, which is what makes
 * it worth measuring for the page budget.
 */
export function CvPreview({
  doc,
  frameRef,
  pageRef,
  contentRef,
  fit,
  isOver,
}: Props) {
  const { t } = useTranslation()
  const style = documentStyle(doc.styleId)

  const links = doc.identity.links.filter(
    (link) => filled(link.label) || filled(link.url),
  )
  const contacts: ReactNode[] = []
  const pushContact = (node: ReactNode, key: string) => {
    if (contacts.length > 0) {
      contacts.push(
        <span key={`sep-${key}`} className="cv-doc-sep">
          {" | "}
        </span>,
      )
    }
    contacts.push(<span key={key}>{node}</span>)
  }

  if (filled(doc.identity.phone)) {
    pushContact(
      <span className="cv-doc-phone">{doc.identity.phone.trim()}</span>,
      "phone",
    )
  }
  for (const [key, value] of [
    ["email", doc.identity.email],
    ["location", doc.identity.location],
  ] as const) {
    if (filled(value)) pushContact(value.trim(), key)
  }
  for (const link of links) {
    pushContact(
      <span className={filled(link.url) ? "cv-doc-link" : undefined}>
        {filled(link.label) ? link.label : link.url}
      </span>,
      link.id,
    )
  }

  const summary = doc.summary.visible
    ? doc.summary.items.filter((line) => line.visible && hasCopy(line))
    : []
  const roles = doc.experience.visible
    ? doc.experience.items.filter((role) => role.visible)
    : []
  const education = doc.education.visible
    ? doc.education.items.filter(
        (entry) =>
          entry.visible && (filled(entry.title) || filled(entry.school)),
      )
    : []
  const skills = doc.skills.visible
    ? doc.skills.items.filter(
        (group) => group.visible && (filled(group.label) || filled(group.items)),
      )
    : []

  const hasName = filled(doc.identity.name)
  const hasHeadline = filled(doc.identity.headline)
  const educationColumn = style.education.hangingMm > 0

  const frameStyle = {
    "--preview-scale": `${fit.scale}`,
    height: fit.heightPx > 0 ? `${fit.heightPx}px` : undefined,
  } as CSSProperties

  return (
    <div className="cv-preview-frame" ref={frameRef} style={frameStyle}>
      <article
        className="cv-page"
        ref={pageRef}
        dir={doc.dir}
        style={styleProperties(style) as CSSProperties}
      >
        <div className="cv-page-content" ref={contentRef}>
          {/* The rule and the gap under the header belong to whatever closes
              it: the headline when there is one, the name block otherwise. */}
          {hasName || contacts.length > 0 ? (
            <div
              className={[
                "cv-doc-masthead",
                style.masthead.inlineContact ? "is-inline" : "",
                hasHeadline ? "" : "is-closing",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {hasName ? (
                <p className="cv-doc-name">{doc.identity.name}</p>
              ) : null}
              {contacts.length > 0 ? (
                <p className="cv-doc-contact">{contacts}</p>
              ) : null}
            </div>
          ) : null}

          {hasHeadline ? (
            <p className="cv-doc-headline is-closing">
              {doc.identity.headline}
            </p>
          ) : null}

          {summary.length > 0 ? (
            <section className="cv-doc-section">
              {filled(doc.summary.title) ? (
                <h3 className="cv-doc-heading">{doc.summary.title}</h3>
              ) : null}
              <Lines kind="summary">
                {summary.map((line) => (
                  <li key={line.id}>
                    <Line line={line} />
                  </li>
                ))}
              </Lines>
            </section>
          ) : null}

          {roles.length > 0 ? (
            <section className="cv-doc-section">
              {filled(doc.experience.title) ? (
                <h3 className="cv-doc-heading">{doc.experience.title}</h3>
              ) : null}
              {roles.map((role) => {
                const head = roleHeadRuns(role)
                const bullets = role.bullets.filter(
                  (bullet) => bullet.visible && hasCopy(bullet),
                )
                if (head.length === 0 && bullets.length === 0) return null
                return (
                  <div key={role.id} className="cv-doc-role">
                    {head.length > 0 ? (
                      <p className="cv-doc-role-head">
                        <Emphasised parts={head} />
                      </p>
                    ) : null}
                    {bullets.length > 0 ? (
                      <Lines kind="bullets">
                        {bullets.map((bullet) => (
                          <li key={bullet.id}>
                            <Line line={bullet} />
                          </li>
                        ))}
                      </Lines>
                    ) : null}
                  </div>
                )
              })}
            </section>
          ) : null}

          {education.length > 0 ? (
            <section className="cv-doc-section">
              {filled(doc.education.title) ? (
                <h3 className="cv-doc-heading">{doc.education.title}</h3>
              ) : null}
              {education.map((entry) => (
                <p key={entry.id} className="cv-doc-education">
                  {/* The dates keep a column of their own when the style hangs
                      the block off one, so a short year leaves the title level
                      with the line above it. */}
                  {filled(entry.period) && educationColumn ? (
                    <span className="cv-doc-period">
                      {periodLabel(entry.period)}
                    </span>
                  ) : (
                    periodPrefix(entry.period)
                  )}
                  {filled(entry.title) ? (
                    <span className="cv-doc-degree">{entry.title.trim()}</span>
                  ) : null}
                  {filled(entry.school)
                    ? `${filled(entry.period) || filled(entry.title) ? ", " : ""}${entry.school}`
                    : null}
                </p>
              ))}
            </section>
          ) : null}

          {skills.length > 0 ? (
            <section className="cv-doc-section">
              {filled(doc.skills.title) ? (
                <h3 className="cv-doc-heading">{doc.skills.title}</h3>
              ) : null}
              <Lines kind="skills">
                {skills.map((group) => (
                  <li key={group.id}>
                    <Emphasised parts={skillRuns(group.label, group.items)} />
                  </li>
                ))}
              </Lines>
            </section>
          ) : null}

          {doc.languages.visible && filled(doc.languages.text) ? (
            <p className="cv-doc-inline">
              {filled(doc.languages.title) ? (
                <span className="cv-doc-inline-label">
                  <span className="cv-doc-inline-word">
                    {doc.languages.title.trim()}
                  </span>
                  :
                </span>
              ) : null}
              <span className="cv-doc-inline-value">
                {doc.languages.text.trim()}
              </span>
            </p>
          ) : null}

          {filled(doc.footnote) ? (
            <p className="cv-doc-footnote">{doc.footnote}</p>
          ) : null}
        </div>

        {isDocumentEmpty(doc) ? (
          <p className="cv-page-empty">{t("preview.empty")}</p>
        ) : null}

        {/* Where page one stops. Drawn only when something spills past it,
            because a rule across a half-empty page reads as a mistake. */}
        <div className={`cv-page-limit${isOver ? " is-visible" : ""}`}>
          <span>{t("preview.pageLimit")}</span>
        </div>
      </article>
    </div>
  )
}
