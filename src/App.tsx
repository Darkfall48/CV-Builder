//? Libraries
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

//? Components
import { AppHeader } from "./cmps/AppHeader"
import { CvPreview } from "./cmps/CvPreview"
import { EditorRail } from "./cmps/EditorRail"
import type { Step, StepId } from "./cmps/EditorRail"
import { EducationSection } from "./cmps/EducationSection"
import { ExperienceSection } from "./cmps/ExperienceSection"
import { ExportBar } from "./cmps/ExportBar"
import { Field } from "./cmps/Field"
import { IdentityBlock } from "./cmps/IdentityBlock"
import { LanguagesBlock } from "./cmps/LanguagesBlock"
import { LocaleStage } from "./cmps/LocaleStage"
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
import { usePointerSpot } from "./hooks/usePointerSpot"
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
  const [step, setStep] = useState<StepId>("identity")

  const frameRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  usePointerSpot()

  const style = documentStyle(doc.styleId)
  const fit = usePreviewFit(frameRef, pageRef)
  const fill = usePageFill(contentRef, usableHeightMm(style))
  const match = useMemo(() => matchOffer(offer, doc), [offer, doc])
  const isEmpty = isDocumentEmpty(doc)

  // A section's heading is the user's, so the rail shows what they called it
  // and only falls back to the interface wording while the field is empty.
  const steps = useMemo<Step[]>(() => {
    const named = (title: string, fallback: string) =>
      title.trim() === "" ? fallback : title.trim()
    const filled = (...parts: string[]) =>
      parts.some((part) => part.trim() !== "")

    return [
      {
        id: "setup",
        index: "01",
        label: t("setup.title"),
        done: filled(doc.fileName),
      },
      {
        id: "identity",
        index: "02",
        label: t("identity.title"),
        done: filled(doc.identity.name, doc.identity.email),
      },
      {
        id: "offer",
        index: "03",
        label: t("offer.title"),
        done: filled(offer),
      },
      {
        id: "summary",
        index: "04",
        label: named(doc.summary.title, t("section.summary")),
        done: doc.summary.items.some((item) => filled(item.lead, item.text)),
        hidden: !doc.summary.visible,
      },
      {
        id: "experience",
        index: "05",
        label: named(doc.experience.title, t("section.experience")),
        done: doc.experience.items.some((role) =>
          filled(role.title, role.company),
        ),
        hidden: !doc.experience.visible,
      },
      {
        id: "education",
        index: "06",
        label: named(doc.education.title, t("section.education")),
        done: doc.education.items.some((entry) =>
          filled(entry.title, entry.school),
        ),
        hidden: !doc.education.visible,
      },
      {
        id: "skills",
        index: "07",
        label: named(doc.skills.title, t("section.skills")),
        done: doc.skills.items.some((group) =>
          filled(group.label, group.items),
        ),
        hidden: !doc.skills.visible,
      },
      {
        id: "languages",
        index: "08",
        label: named(doc.languages.title, t("section.languages")),
        done: filled(doc.languages.text),
        hidden: !doc.languages.visible,
      },
      {
        id: "footnote",
        index: "09",
        label: t("line.footnote"),
        done: filled(doc.footnote),
      },
    ]
  }, [doc, offer, t])

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

  // One step at a time. Mounting only the open one is what keeps the editor
  // inside a single viewport; nothing is lost by unmounting, since every field
  // writes straight into the document held here.
  function renderStep() {
    switch (step) {
      case "setup":
        return (
          <SetupBlock
            index="01"
            styleId={doc.styleId}
            onStyleChange={(styleId) => update({ styleId })}
            dir={doc.dir}
            onDirChange={(dir) => update({ dir })}
            fileName={doc.fileName}
            onFileNameChange={(fileName) => update({ fileName })}
          />
        )
      case "identity":
        return (
          <IdentityBlock
            index="02"
            identity={doc.identity}
            onChange={(identity) => update({ identity })}
            dir={doc.dir}
          />
        )
      case "offer":
        return (
          <OfferBlock
            index="03"
            offer={offer}
            onOfferChange={setOffer}
            match={match}
          />
        )
      case "summary":
        return (
          <SummarySection
            index="04"
            section={doc.summary}
            onChange={(summary) => update({ summary })}
            dir={doc.dir}
            matched={match.matchedLines}
          />
        )
      case "experience":
        return (
          <ExperienceSection
            index="05"
            section={doc.experience}
            onChange={(experience) => update({ experience })}
            dir={doc.dir}
            matched={match.matchedLines}
          />
        )
      case "education":
        return (
          <EducationSection
            index="06"
            section={doc.education}
            onChange={(education) => update({ education })}
            dir={doc.dir}
            matched={match.matchedLines}
          />
        )
      case "skills":
        return (
          <SkillsSection
            index="07"
            section={doc.skills}
            onChange={(skills) => update({ skills })}
            dir={doc.dir}
            matched={match.matchedLines}
          />
        )
      case "languages":
        return (
          <LanguagesBlock
            index="08"
            section={doc.languages}
            onChange={(languages) => update({ languages })}
            dir={doc.dir}
          />
        )
      case "footnote":
        return (
          <section className="editor-block">
            <header className="editor-block-head">
              <h2 className="editor-block-title hud-title">
                <span className="hud-index" aria-hidden="true">
                  09
                </span>
                {t("line.footnote")}
              </h2>
            </header>
            <Field
              label={t("line.footnote")}
              value={doc.footnote}
              hint={t("line.footnoteHint")}
              dir={doc.dir}
              wide
              onChange={(footnote) => update({ footnote })}
            />
          </section>
        )
    }
  }

  return (
    <LocaleStage>
      <div className="app">
        <AppHeader
          onLoadExample={() => setDoc(exampleDocument(seedFrom(t)))}
          onReset={onReset}
          onExportFile={() =>
            downloadText(
              toJson(doc),
              `${downloadName}.json`,
              "application/json",
            )
          }
          onImportFile={(file) => void onImportFile(file)}
        />

        <main className="app-main">
          <EditorRail steps={steps} active={step} onSelect={setStep} />

          <div className="app-editor">
            <div
              className="app-editor-panel"
              role="tabpanel"
              id={`step-panel-${step}`}
              aria-labelledby={`step-tab-${step}`}
              // Remounts on every step, which replays the panel's entrance and
              // makes the switch read as a change rather than a content swap.
              key={step}
            >
              {renderStep()}
            </div>
            <p className="app-editor-note">{t("app.saved")}</p>
          </div>

          <aside className="app-preview">
            <h2 className="hud-title app-preview-title">
              {t("preview.title")}
            </h2>
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
    </LocaleStage>
  )
}
