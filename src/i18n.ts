//? Libraries
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

//? Content / i18n
import en from "./locales/en.json"
import fr from "./locales/fr.json"
import he from "./locales/he.json"

export const SUPPORTED_LOCALES = ["en", "fr", "he"] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

const STORAGE_KEY = "cv-builder-locale"

export function localeDir(locale: Locale): "ltr" | "rtl" {
  return locale === "he" ? "rtl" : "ltr"
}

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale
  document.documentElement.dir = localeDir(locale)
}

function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && isLocale(stored)) return stored
  } catch {
    // Private mode or blocked storage — fall through to navigator.
  }

  const nav = navigator.language.slice(0, 2)
  if (isLocale(nav)) return nav
  return "en"
}

function persistLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Ignore quota / privacy errors.
  }
  applyDocumentLocale(locale)
}

const initialLocale = detectLocale()
applyDocumentLocale(initialLocale)

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    he: { translation: he },
  },
  lng: initialLocale,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

i18n.on("languageChanged", (lng) => {
  if (isLocale(lng)) persistLocale(lng)
})

export default i18n
