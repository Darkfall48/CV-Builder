//? Libraries
import { useState } from "react"

//? Config
import { persistTheme } from "../theme"
import type { Theme } from "../theme"

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark"
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark"
    persistTheme(next)
    setTheme(next)
  }

  return { theme, toggle }
}
