//? Libraries
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"

//? Components
import { EditorBlock } from "./EditorBlock"

//? Services
import type { OfferMatch } from "../services/jobMatch"

type Props = {
  index: string
  offer: string
  onOfferChange: (value: string) => void
  match: OfferMatch
}

export function OfferBlock({ index, offer, onOfferChange, match }: Props) {
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
    </EditorBlock>
  )
}
