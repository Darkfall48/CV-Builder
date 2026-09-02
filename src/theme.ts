export type Theme = "dark" | "light"

const STORAGE_KEY = "cv-builder-theme"

function isTheme(value: string): value is Theme {
  return value === "dark" || value === "light"
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

function detectTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && isTheme(stored)) return stored
  } catch {
    // Private mode or blocked storage — keep the dark default.
  }
  return "dark"
}

export function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Ignore quota / privacy errors.
  }
  applyTheme(theme)
}

// The inline script in index.html already set the attribute to avoid a flash.
// This keeps the module the single source of truth once the bundle runs.
applyTheme(detectTheme())
