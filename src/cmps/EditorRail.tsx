//? Libraries
import { useTranslation } from "react-i18next"

//? Icons
import { FiCheck, FiEyeOff } from "react-icons/fi"

export type StepId =
  | "setup"
  | "identity"
  | "offer"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "footnote"

export type Step = {
  id: StepId
  /** Rendered as the HUD index, so it is a string and not a count. */
  index: string
  label: string
  /** Drives the filled dot: whether this step carries any content yet. */
  done: boolean
  /** Sections only: the step is written but kept out of the document. */
  hidden?: boolean
}

type Props = {
  steps: Step[]
  active: StepId
  onSelect: (id: StepId) => void
}

/**
 * The editor's table of contents and its only means of navigation. One step is
 * open at a time, which is what keeps the whole interface inside one viewport
 * instead of a column you scroll for several screens.
 */
export function EditorRail({ steps, active, onSelect }: Props) {
  const { t } = useTranslation()

  // Roving arrow keys, because a vertical list of nine is faster to walk than
  // to tab through, and the list is short enough to wrap at both ends.
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight"
    const back = event.key === "ArrowUp" || event.key === "ArrowLeft"
    if (!forward && !back) return

    event.preventDefault()
    const at = steps.findIndex((step) => step.id === active)
    const next = (at + (forward ? 1 : -1) + steps.length) % steps.length
    onSelect(steps[next].id)
  }

  return (
    <nav
      className="editor-rail"
      aria-label={t("rail.title")}
      onKeyDown={onKeyDown}
    >
      <h2 className="hud-title editor-rail-title">{t("rail.title")}</h2>

      <div className="editor-rail-list" role="tablist" aria-orientation="vertical">
        {steps.map((step) => {
          const isActive = step.id === active
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              id={`step-tab-${step.id}`}
              aria-selected={isActive}
              aria-controls={`step-panel-${step.id}`}
              // Only the active tab stays tabbable; the arrow keys cover the rest.
              tabIndex={isActive ? 0 : -1}
              className={`editor-rail-step${isActive ? " is-active" : ""}${
                step.hidden ? " is-omitted" : ""
              }`}
              onClick={() => onSelect(step.id)}
            >
              <span className="editor-rail-index" aria-hidden="true">
                {step.index}
              </span>
              <span className="editor-rail-label">{step.label}</span>
              <span className="editor-rail-state" aria-hidden="true">
                {step.hidden ? (
                  <FiEyeOff />
                ) : step.done ? (
                  <FiCheck />
                ) : (
                  <span className="editor-rail-dot" />
                )}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
