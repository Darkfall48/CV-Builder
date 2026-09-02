//? Libraries
import { useTranslation } from "react-i18next"
import type { ReactNode } from "react"

//? Model
import type { CvDirection } from "../model/types"

//? Icons
import { FiEye, FiEyeOff, FiPlus } from "react-icons/fi"

type Props = {
  index: string
  /** Editable, because the heading is document content and not a label. */
  title: string
  onTitleChange: (value: string) => void
  visible: boolean
  onToggleVisible: () => void
  dir: CvDirection
  /** Left out by a section that holds one line and has nothing to add to. */
  addLabel?: string
  onAdd?: () => void
  children: ReactNode
}

/**
 * A content section: its heading is typed by the user rather than translated,
 * so the same document reads the same whatever language the interface is in.
 */
export function SectionBlock({
  index,
  title,
  onTitleChange,
  visible,
  onToggleVisible,
  dir,
  addLabel,
  onAdd,
  children,
}: Props) {
  const { t } = useTranslation()

  return (
    <section className={`editor-block${visible ? "" : " is-hidden"}`}>
      <header className="editor-block-head">
        <span className="hud-index" aria-hidden="true">
          {index}
        </span>
        <input
          className="editor-block-heading"
          value={title}
          dir={dir}
          aria-label={t("section.heading")}
          onChange={(event) => onTitleChange(event.target.value)}
        />
        <div className="editor-block-tools">
          <button
            type="button"
            className="item-row-tool"
            title={visible ? t("action.hide") : t("action.show")}
            aria-label={visible ? t("action.hide") : t("action.show")}
            aria-pressed={!visible}
            onClick={onToggleVisible}
          >
            {visible ? (
              <FiEye aria-hidden="true" />
            ) : (
              <FiEyeOff aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {visible ? null : (
        <p className="editor-block-note">{t("section.hidden")}</p>
      )}

      {children}

      {onAdd ? (
        <button type="button" className="editor-block-add" onClick={onAdd}>
          <FiPlus aria-hidden="true" />
          <span>{addLabel}</span>
        </button>
      ) : null}
    </section>
  )
}
