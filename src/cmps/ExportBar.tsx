//? Libraries
import { useTranslation } from "react-i18next"

//? Icons
import { FiDownload, FiLoader } from "react-icons/fi"

type Props = {
  /** Share of one page the document takes, 1 being exactly full. */
  fill: number
  isEmpty: boolean
  isBusy: boolean
  error: string
  onDownload: () => void
}

export function ExportBar({ fill, isEmpty, isBusy, error, onDownload }: Props) {
  const { t } = useTranslation()
  const isOver = fill > 1
  const percent = Math.round((isOver ? fill - 1 : fill) * 100)

  return (
    <footer className="export-bar">
      <div className={`fill-bar${isOver ? " is-over" : ""}`} role="status">
        <progress
          className="fill-bar-track"
          value={Math.min(fill, 1)}
          max={1}
        />
        <span className="fill-bar-text">
          {isOver
            ? t("preview.over", { percent })
            : t("preview.fill", { percent })}
        </span>
      </div>

      <button
        type="button"
        className="export-bar-download"
        disabled={isEmpty || isBusy}
        aria-busy={isBusy}
        onClick={onDownload}
      >
        {isBusy ? (
          <FiLoader aria-hidden="true" />
        ) : (
          <FiDownload aria-hidden="true" />
        )}
        <span>
          {isEmpty
            ? t("export.empty")
            : isBusy
              ? t("export.working")
              : t("export.download")}
        </span>
      </button>

      {error ? <p className="export-bar-error">{error}</p> : null}
    </footer>
  )
}
