//? Model
import type { CvDirection } from "../model/types"

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  multiline?: boolean
  rows?: number
  type?: "text" | "email" | "tel" | "url"
  /**
   * Fields holding CV content follow the document's direction, not the
   * interface's: a Hebrew CV is written right to left inside an English UI.
   */
  dir?: CvDirection
  spellCheck?: boolean
  /** Takes the whole row of a field grid instead of one of its columns. */
  wide?: boolean
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  multiline = false,
  rows = 3,
  type = "text",
  dir,
  spellCheck,
  wide = false,
}: Props) {
  return (
    <label className={`field${wide ? " is-wide" : ""}`}>
      <span className="field-label">{label}</span>
      {multiline ? (
        <textarea
          className="field-control"
          value={value}
          rows={rows}
          dir={dir}
          placeholder={placeholder}
          spellCheck={spellCheck}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="field-control"
          type={type}
          value={value}
          dir={dir}
          placeholder={placeholder}
          spellCheck={spellCheck}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint ? <small className="field-hint">{hint}</small> : null}
    </label>
  )
}
