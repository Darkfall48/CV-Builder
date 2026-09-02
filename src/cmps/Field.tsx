//? Libraries
import { useId } from "react"

//? Model
import type { CvDirection } from "../model/types"

//? Icons
import { FiEye, FiEyeOff } from "react-icons/fi"

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
  /** Whether this value is rendered in the preview and exported document. */
  visible?: boolean
  onToggleVisible?: () => void
  visibilityLabel?: string
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
  visible = true,
  onToggleVisible,
  visibilityLabel,
}: Props) {
  const id = useId()

  return (
    <div
      className={`field${wide ? " is-wide" : ""}${visible ? "" : " is-hidden"}`}
    >
      <span className="field-head">
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
        {onToggleVisible ? (
          <button
            type="button"
            className="field-visibility"
            title={visibilityLabel}
            aria-label={visibilityLabel}
            aria-pressed={!visible}
            onClick={onToggleVisible}
          >
            {visible ? (
              <FiEye aria-hidden="true" />
            ) : (
              <FiEyeOff aria-hidden="true" />
            )}
          </button>
        ) : null}
      </span>
      {multiline ? (
        <textarea
          id={id}
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
          id={id}
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
    </div>
  )
}
