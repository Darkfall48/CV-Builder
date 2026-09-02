//? Libraries
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"

//? Components
import { EditorBlock } from "./EditorBlock"

//? Services
import type { AtsFinding, AtsReport } from "../services/atsAudit"
import type { OfferMatch } from "../services/jobMatch"

//? Icons
import { FiAlertTriangle, FiCheck, FiFileText, FiX } from "react-icons/fi"

type Props = {
  index: string
  offer: string
  onOfferChange: (value: string) => void
  match: OfferMatch
  ats: AtsReport
  hasDocxAudit: boolean
  parsedText: string
  isAuditing: boolean
  auditFailed: boolean
  onRunAudit: () => void
}

const findingIcon = (finding: AtsFinding) => {
  if (finding.status === "pass") return <FiCheck aria-hidden="true" />
  if (finding.status === "fail") return <FiX aria-hidden="true" />
  return <FiAlertTriangle aria-hidden="true" />
}

export function OfferBlock({
  index,
  offer,
  onOfferChange,
  match,
  ats,
  hasDocxAudit,
  parsedText,
  isAuditing,
  auditFailed,
  onRunAudit,
}: Props) {
  const { t } = useTranslation()
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const [pasteFailed, setPasteFailed] = useState(false)

  /**
   * Firefox refuses a clipboard read outside a paste gesture, and a denied
   * permission lands in the same place. Neither is worth an error banner: the
   * textarea is right there, so the fallback is to focus it and say so.
   */
  async function onPaste() {
    try {
      const text = await navigator.clipboard.readText()
      onOfferChange(text)
      setPasteFailed(false)
    } catch {
      setPasteFailed(true)
      areaRef.current?.focus()
    }
  }

  const asked = match.covered.length + match.missing.length
  const hasOffer = offer.trim() !== ""

  return (
    <EditorBlock
      index={index}
      title={t("offer.title")}
      tools={
        <>
          <button type="button" className="chip" onClick={onPaste}>
            {t("offer.paste")}
          </button>
          <button
            type="button"
            className="chip"
            disabled={!hasOffer}
            onClick={() => {
              onOfferChange("")
              setPasteFailed(false)
            }}
          >
            {t("offer.clear")}
          </button>
        </>
      }
    >
      {/* No visible legend: the card is already titled, and a second one
          reading the same words is noise for anyone hearing the page. */}
      <div className="field is-wide">
        <textarea
          ref={areaRef}
          className="field-control"
          rows={4}
          value={offer}
          aria-label={t("offer.title")}
          placeholder={t("offer.placeholder")}
          onChange={(event) => onOfferChange(event.target.value)}
        />
        <small className="field-hint">
          {pasteFailed ? t("offer.pasteFailed") : t("offer.hint")}
        </small>
      </div>

      {hasOffer ? (
        <div className="offer-read">
          {asked === 0 ? (
            <p className="offer-empty">{t("offer.none")}</p>
          ) : (
            <>
              <p className="offer-coverage">
                {t("offer.coverage", {
                  covered: match.covered.length,
                  total: asked,
                })}
              </p>

              {/* The recognised terms are listed on purpose: a short name like
                  React turns up in prose that has nothing to do with the tool,
                  and only the eye can tell. The count is a hint, not a verdict. */}
              <div className="offer-rows">
                {match.covered.length > 0 ? (
                  <p className="offer-terms">
                    <span className="offer-legend">{t("offer.covered")}</span>
                    <span className="offer-list">
                      {match.covered.map((term) => (
                        <span key={term} className="offer-term">
                          {term}
                        </span>
                      ))}
                    </span>
                  </p>
                ) : null}

                {match.missing.length > 0 ? (
                  <p className="offer-terms is-gap">
                    <span className="offer-legend">{t("offer.missing")}</span>
                    <span className="offer-list">
                      {match.missing.map((term) => (
                        <span key={term} className="offer-term">
                          {term}
                        </span>
                      ))}
                    </span>
                  </p>
                ) : (
                  <p className="offer-empty">{t("offer.allCovered")}</p>
                )}
              </div>
            </>
          )}
        </div>
      ) : null}

      <section className="ats-audit" aria-labelledby="ats-audit-title">
        <div className="ats-audit-head">
          <div>
            <h3 id="ats-audit-title" className="ats-audit-title">
              {t("offer.ats.title")}
            </h3>
            <p className="ats-audit-note">{t("offer.ats.note")}</p>
          </div>
          <span className={`ats-audit-verdict is-${ats.verdict}`}>
            {t(`offer.ats.verdict.${ats.verdict}`)}
          </span>
        </div>

        <div className="ats-audit-actions">
          <button
            type="button"
            className="chip"
            disabled={isAuditing}
            aria-busy={isAuditing}
            onClick={onRunAudit}
          >
            <FiFileText aria-hidden="true" />
            {isAuditing
              ? t("offer.ats.checking")
              : hasDocxAudit
                ? t("offer.ats.recheck")
                : t("offer.ats.checkDocx")}
          </button>
          <span className="ats-audit-local">{t("offer.ats.local")}</span>
        </div>

        {auditFailed ? (
          <p className="ats-audit-error" role="alert">
            {t("offer.ats.failed")}
          </p>
        ) : null}

        <div className="ats-audit-layers">
          {(["structure", "content", "docx"] as const).map((layer) => {
            const findings = ats.findings.filter(
              (finding) => finding.layer === layer,
            )
            if (findings.length === 0) {
              if (layer !== "docx") return null
              return (
                <div key={layer} className="ats-layer">
                  <h4 className="ats-layer-title">
                    {t(`offer.ats.layer.${layer}`)}
                  </h4>
                  <p className="ats-layer-pending">
                    {t("offer.ats.docxPending")}
                  </p>
                </div>
              )
            }

            const issues = findings.filter(
              (finding) => finding.status !== "pass",
            )
            const passed = findings.filter(
              (finding) => finding.status === "pass",
            )

            return (
              <div key={layer} className="ats-layer">
                <h4 className="ats-layer-title">
                  {t(`offer.ats.layer.${layer}`)}
                </h4>
                {issues.map((finding) => (
                  <p
                    key={finding.code}
                    className={`ats-finding is-${finding.status}`}
                  >
                    <span className="ats-finding-icon">
                      {findingIcon(finding)}
                    </span>
                    <span>
                      {t(
                        `offer.ats.finding.${finding.code}`,
                        finding.values,
                      )}
                    </span>
                  </p>
                ))}
                {passed.length > 0 ? (
                  <details className="ats-passes">
                    <summary>
                      {t("offer.ats.passed", { count: passed.length })}
                    </summary>
                    {passed.map((finding) => (
                      <p key={finding.code} className="ats-finding is-pass">
                        <span className="ats-finding-icon">
                          {findingIcon(finding)}
                        </span>
                        <span>
                          {t(
                            `offer.ats.finding.${finding.code}`,
                            finding.values,
                          )}
                        </span>
                      </p>
                    ))}
                  </details>
                ) : null}
              </div>
            )
          })}
        </div>

        {parsedText ? (
          <details className="ats-plain">
            <summary>{t("offer.ats.plainText")}</summary>
            <pre dir="auto">{parsedText}</pre>
          </details>
        ) : null}
      </section>
    </EditorBlock>
  )
}
