//? Libraries
import { useCallback, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

//? Content / i18n
import { isLocale, localeDir, type Locale } from "../i18n"

//? Components
import { LocaleStageContext } from "./locale-stage-context"

type Props = {
  children: ReactNode
}

// Must match the locale-defocus keyframes: the copy swaps at the midpoint,
// where the blur peaks and hides the substitution.
const FLIP_MS = 620
const MID_MS = 310

export function LocaleStage({ children }: Props) {
  const { i18n } = useTranslation()
  const [phase, setPhase] = useState("")
  const lock = useRef(false)

  const requestLocale = useCallback(
    (next: Locale) => {
      const current = i18n.language.slice(0, 2)
      if (!isLocale(next) || next === current || lock.current) return

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
      if (reduced) {
        void i18n.changeLanguage(next)
        return
      }

      lock.current = true
      setPhase(localeDir(next) === "rtl" ? "is-flip-to-rtl" : "is-flip-to-ltr")

      window.setTimeout(() => {
        void i18n.changeLanguage(next)
      }, MID_MS)

      window.setTimeout(() => {
        setPhase("")
        lock.current = false
      }, FLIP_MS)
    },
    [i18n],
  )

  return (
    <LocaleStageContext.Provider value={requestLocale}>
      <div className={`locale-stage${phase ? ` ${phase}` : ""}`}>
        {children}
      </div>
    </LocaleStageContext.Provider>
  )
}
