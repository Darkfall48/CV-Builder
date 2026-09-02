//? Libraries
import { createContext, useContext } from "react"

//? Content / i18n
import type { Locale } from "../i18n"

export const LocaleStageContext = createContext<(locale: Locale) => void>(
  () => {},
)

export function useRequestLocale() {
  return useContext(LocaleStageContext)
}
