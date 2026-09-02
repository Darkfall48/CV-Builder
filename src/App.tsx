//? Libraries
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

//? Components
import { AppHeader } from "./cmps/AppHeader"
import { CvPreview } from "./cmps/CvPreview"
import { EducationSection } from "./cmps/EducationSection"
import { ExperienceSection } from "./cmps/ExperienceSection"
import { ExportBar } from "./cmps/ExportBar"
import { Field } from "./cmps/Field"
import { IdentityBlock } from "./cmps/IdentityBlock"
import { LanguagesBlock } from "./cmps/LanguagesBlock"
import { OfferBlock } from "./cmps/OfferBlock"
import { SetupBlock } from "./cmps/SetupBlock"
import { SkillsSection } from "./cmps/SkillsSection"
import { SummarySection } from "./cmps/SummarySection"

//? Model
import { emptyDocument, exampleDocument, isDocumentEmpty } from "./model/document"
import type { DocumentSeed } from "./model/document"
import {
  clearStoredDocument,
  fromJson,
  loadDocument,
  saveDocument,
  toJson,
} from "./model/storage"
import type { CvDocument } from "./model/types"

//? Hooks
import { usePageFill } from "./hooks/usePageFill"
import { usePreviewFit } from "./hooks/usePreviewFit"

//? Services
import { documentStyle, usableHeightMm } from "./services/docStyles"
import { downloadBlob, downloadText, sanitizeFileName } from "./services/download"
import { matchOffer } from "./services/jobMatch"

/** Section headings start in the interface language, then belong to the user. */
function seedFrom(t: TFunction): DocumentSeed {
  return {
    summaryTitle: t("section.summary"),
    experienceTitle: t("section.experience"),
    educationTitle: t("section.education"),
    skillsTitle: t("section.skills"),
    languagesTitle: t("section.languages"),
    fileName: "",
  }
}

export default function App() {
  const { t } = useTranslation()
  const [doc, setDoc] = useState<CvDocument>(
    () => loadDocument() ?? emptyDocument(seedFrom(t)),
  )
  const [offer, setOffer] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState("")

  const frameRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const style = documentStyle(doc.styleId)
  const fit = usePreviewFit(frameRef, pageRef)
  const fill = usePageFill(contentRef, usableHeightMm(style))
  const match = useMemo(() => matchOffer(offer, doc), [offer, doc])
  const isEmpty = isDocumentEmpty(doc)

  // Typing should not hit storage on every keystroke, and a CV is never so
  // urgent that a moment's delay could lose it.
  useEffect(() => {
    const timer = setTimeout(() => saveDocument(doc), 400)
    return () => clearTimeout(timer)
  }, [doc])

  const update = (part: Partial<CvDocument>) =>
    setDoc((current) => ({ ...current, ...part }))

  const downloadName =
    sanitizeFileName(doc.fileName) ||
    sanitizeFileName(doc.identity.name) ||
    "CV"

  async function onDownload() {
    setIsBusy(true)
    setError("")
    try {
      // Imported on demand: the OOXML writer weighs more than the rest of the
      // app, and someone still filling in their first role does not need it.
      const { renderCvDocx } = await import("./services/cvDocx")
      const blob = await renderCvDocx(doc)
      downloadBlob(blob, `${downloadName}.docx`)
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause)
      setError(t("export.failed", { reason }))
    } finally {
      setIsBusy(false)
    }
  }

  async function onImportFile(file: File) {
    setError("")
    const parsed = fromJson(await file.text())
    if (!parsed) {
      setError(t("data.importFailed"))
      return
    }
    setDoc(parsed)
  }

  function onReset() {
    if (!window.confirm(t("data.resetConfirm"))) return
    clearStoredDocument()
    setDoc(emptyDocument(seedFrom(t)))
    setError("")
  }

  return (
    <div className="app">
      <AppHeader
        onLoadExample={() => setDoc(exampleDocument(seedFrom(t)))}
        onReset={onReset}
        onExportFile={() =>
          downloadText(toJson(doc), `${downloadName}.json`, "application/json")
        }
        onImportFile={(file) => void onImportFile(file)}
      />

      <main className="app-main">
        <div className="app-editor">
          <SetupBlock
            index="01"
            styleId={doc.styleId}
            onStyleChange={(styleId) => update({ styleId })}
            dir={doc.dir}
            onDirChange={(dir) => update({ dir })}
            fileName={doc.fileName}
            onFileNameChange={(fileName) => update({ fileName })}
          />

          <IdentityBlock
            index="02"
            identity={doc.identity}
            onChange={(identity) => update({ identity })}
            dir={doc.dir}
          />

          <OfferBlock
            index="03"
            offer={offer}
            onOfferChange={setOffer}
            match={match}
          />

          <SummarySection
            index="04"
            section={doc.summary}
            onChange={(summary) => update({ summary })}
            dir={doc.dir}
            matched={match.matchedLines}
          />

          <ExperienceSection
            index="05"
            section={doc.experience}
            onChange={(experience) => update({ experience })}
            dir={doc.dir}
            matched={match.matchedLines}
          />

          <EducationSection
            index="06"
            section={doc.education}
            onChange={(education) => update({ education })}
            dir={doc.dir}
            matched={match.matchedLines}
          />

          <SkillsSection
            index="07"
            section={doc.skills}
            onChange={(skills) => update({ skills })}
            dir={doc.dir}
            matched={match.matchedLines}
          />

          <LanguagesBlock
            index="08"
            section={doc.languages}
            onChange={(languages) => update({ languages })}
            dir={doc.dir}
          />

          <section className="editor-block">
            <Field
              label={t("line.footnote")}
              value={doc.footnote}
              hint={t("line.footnoteHint")}
              dir={doc.dir}
              wide
              onChange={(footnote) => update({ footnote })}
            />
          </section>

          <p className="app-editor-note">{t("app.saved")}</p>
        </div>

        <aside className="app-preview">
          <h2 className="hud-title app-preview-title">{t("preview.title")}</h2>
          {/* Only the sheet scrolls, so the export bar below it cannot be
              scrolled out of reach. */}
          <div className="app-preview-scroll">
            <CvPreview
              doc={doc}
              frameRef={frameRef}
              pageRef={pageRef}
              contentRef={contentRef}
              fit={fit}
              isOver={fill > 1}
            />
          </div>
          <ExportBar
            fill={fill}
            isEmpty={isEmpty}
            isBusy={isBusy}
            error={error}
            onDownload={() => void onDownload()}
          />
        </aside>
      </main>
    </div>
  )
}
