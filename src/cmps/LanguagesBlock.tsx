//? Libraries
import { useTranslation } from "react-i18next"

//? Components
import { Field } from "./Field"
import { SectionBlock } from "./SectionBlock"

//? Model
import type { CvDirection, CvInlineSection } from "../model/types"

type Props = {
  index: string
  section: CvInlineSection
  onChange: (next: CvInlineSection) => void
  dir: CvDirection
}

/**
 * One line, one field. Languages need a heading of their own on the page but
 * not a list underneath, so the block reuses the section header for the
 * editable title and the visibility switch, and stops there.
 */
export function LanguagesBlock({ index, section, onChange, dir }: Props) {
  const { t } = useTranslation()

  return (
    <SectionBlock
      index={index}
      title={section.title}
      onTitleChange={(title) => onChange({ ...section, title })}
      visible={section.visible}
      onToggleVisible={() => onChange({ ...section, visible: !section.visible })}
      dir={dir}
    >
      <Field
        label={t("line.languages")}
        value={section.text}
        hint={t("line.languagesHint")}
        dir={dir}
        wide
        onChange={(text) => onChange({ ...section, text })}
      />
    </SectionBlock>
  )
}
