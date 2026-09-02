//? Libraries
import { useTranslation } from "react-i18next"
import type { ReactNode } from "react"

//? Icons
import {
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiEyeOff,
  FiTrash2,
} from "react-icons/fi"

type Props = {
  visible: boolean
  matched?: boolean
  isFirst: boolean
  isLast: boolean
  onToggleVisible: () => void
  onMove: (delta: number) => void
  onRemove: () => void
  children: ReactNode
}

/**
 * One entry of the document, with the four things any entry needs: reorder,
 * leave out, delete, edit. Hiding is not deleting — a line dropped to make the
 * page fit is usually wanted back for the next application.
 */
export function ItemRow({
  visible,
  matched = false,
  isFirst,
  isLast,
  onToggleVisible,
  onMove,
  onRemove,
  children,
}: Props) {
  const { t } = useTranslation()

  const classes = ["item-row", visible ? "" : "is-hidden", matched ? "is-matched" : ""]
    .filter(Boolean)
    .join(" ")

  return (
    <li className={classes}>
      <div className="item-row-fields">{children}</div>
      <div className="item-row-tools">
        <button
          type="button"
          className="item-row-tool"
          title={visible ? t("action.hide") : t("action.show")}
          aria-label={visible ? t("action.hide") : t("action.show")}
          aria-pressed={!visible}
          onClick={onToggleVisible}
        >
          {visible ? <FiEye aria-hidden="true" /> : <FiEyeOff aria-hidden="true" />}
        </button>
        <button
          type="button"
          className="item-row-tool"
          title={t("action.moveUp")}
          aria-label={t("action.moveUp")}
          disabled={isFirst}
          onClick={() => onMove(-1)}
        >
          <FiChevronUp aria-hidden="true" />
        </button>
        <button
          type="button"
          className="item-row-tool"
          title={t("action.moveDown")}
          aria-label={t("action.moveDown")}
          disabled={isLast}
          onClick={() => onMove(1)}
        >
          <FiChevronDown aria-hidden="true" />
        </button>
        <button
          type="button"
          className="item-row-tool is-danger"
          title={t("action.remove")}
          aria-label={t("action.remove")}
          onClick={onRemove}
        >
          <FiTrash2 aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}
