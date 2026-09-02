//? Libraries
import { useTranslation } from "react-i18next"

//? Components
import { EditorBlock } from "./EditorBlock"
import { Field } from "./Field"

//? Model
import type { CvDirection, StyleId } from "../model/types"

//? Services
import { STYLE_IDS } from "../services/docStyles"

const DIRECTIONS: CvDirection[] = ["ltr", "rtl"]

const STYLE_LABEL: Record<StyleId, string> = {
  hud: "setup.styleHud",
  classic: "setup.styleClassic",
}

type Props = {
  index: string
  styleId: StyleId
  onStyleChange: (id: StyleId) => void
  dir: CvDirection
  onDirChange: (dir: CvDirection) => void
  fileName: string
  onFileNameChange: (value: string) => void
}

export function SetupBlock({
  index,
  styleId,
  onStyleChange,
  dir,
  onDirChange,
  fileName,
  onFileNameChange,
}: Props) {
  const { t } = useTranslation()

  return (
    <EditorBlock index={index} title={t("setup.title")}>
      <div className="chip-row" role="group" aria-label={t("setup.style")}>
        <p className="chip-row-label hud-label">{t("setup.style")}</p>
        {STYLE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className="chip"
            aria-pressed={id === styleId}
            onClick={() => onStyleChange(id)}
          >
            {t(STYLE_LABEL[id])}
          </button>
        ))}
      </div>

      <div className="chip-row" role="group" aria-label={t("setup.direction")}>
        <p className="chip-row-label hud-label">{t("setup.direction")}</p>
        {DIRECTIONS.map((value) => (
          <button
            key={value}
            type="button"
            className="chip"
            aria-pressed={value === dir}
            onClick={() => onDirChange(value)}
          >
            {t(value === "ltr" ? "setup.directionLtr" : "setup.directionRtl")}
          </button>
        ))}
        <small className="chip-row-hint">{t("setup.directionHint")}</small>
      </div>

      <Field
        label={t("setup.fileName")}
        value={fileName}
        hint={t("setup.fileNameHint")}
        spellCheck={false}
        wide
        onChange={onFileNameChange}
      />
    </EditorBlock>
  )
}
