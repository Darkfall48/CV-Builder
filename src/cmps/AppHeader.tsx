//? Libraries
import { useRef } from "react"
import { useTranslation } from "react-i18next"

//? Content / i18n
import { SUPPORTED_LOCALES } from "../i18n"

//? Components
import { useRequestLocale } from "./locale-stage-context"

//? Hooks
import { useTheme } from "../hooks/useTheme"

//? Icons
import { FiFilePlus, FiMoon, FiRotateCcw, FiSave, FiSun, FiUpload } from "react-icons/fi"

type Props = {
  onLoadExample: () => void
  onReset: () => void
  onExportFile: () => void
  onImportFile: (file: File) => void
}

export function AppHeader({
  onLoadExample,
  onReset,
  onExportFile,
  onImportFile,
}: Props) {
  const { t, i18n } = useTranslation()
  const { theme, toggle } = useTheme()
  const requestLocale = useRequestLocale()
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <header className="app-header">
      <div className="app-header-identity">
        <h1 className="app-header-name">{t("app.name")}</h1>
        <p className="app-header-tagline">{t("app.tagline")}</p>
      </div>

      <div className="app-header-tools">
        <div className="app-header-data">
          <button type="button" className="chip" onClick={onLoadExample}>
            <FiFilePlus aria-hidden="true" />
            <span>{t("data.example")}</span>
          </button>
          <button type="button" className="chip" onClick={onExportFile}>
            <FiSave aria-hidden="true" />
            <span>{t("data.export")}</span>
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => fileRef.current?.click()}
          >
            <FiUpload aria-hidden="true" />
            <span>{t("data.import")}</span>
          </button>
          <button type="button" className="chip" onClick={onReset}>
            <FiRotateCcw aria-hidden="true" />
            <span>{t("data.reset")}</span>
          </button>
          {/* Kept out of the tab order and off screen: the button above is the
              control, and a bare file input beside it would be a second one. */}
          <input
            ref={fileRef}
            className="app-header-file"
            type="file"
            accept="application/json,.json"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onImportFile(file)
              // Reset, or picking the same file twice fires no change event.
              event.target.value = ""
            }}
          />
        </div>

        <div className="app-header-lang" role="group">
          {SUPPORTED_LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              className="app-header-lang-btn"
              aria-pressed={i18n.resolvedLanguage === locale}
              onClick={() => requestLocale(locale)}
            >
              {t(`lang.${locale}`)}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="app-header-theme"
          title={t("action.theme")}
          aria-label={t("action.theme")}
          onClick={toggle}
        >
          {theme === "dark" ? (
            <FiSun aria-hidden="true" />
          ) : (
            <FiMoon aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  )
}
