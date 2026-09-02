//? Libraries
import { useTranslation } from "react-i18next"

//? Components
import { Field } from "./Field"
import { ItemRow } from "./ItemRow"
import { SectionBlock } from "./SectionBlock"

//? Model
import { newLine } from "../model/document"
import { sectionOps } from "../model/section"
import type { CvDirection, CvLine, CvSection, Id } from "../model/types"

type Props = {
  index: string
  section: CvSection<CvLine>
  onChange: (next: CvSection<CvLine>) => void
  dir: CvDirection
  matched: ReadonlySet<Id>
}

export function SummarySection({
  index,
  section,
  onChange,
  dir,
  matched,
}: Props) {
  const { t } = useTranslation()
  const ops = sectionOps(section, onChange)

  return (
    <SectionBlock
      index={index}
      title={section.title}
      onTitleChange={ops.setTitle}
      visible={section.visible}
      onToggleVisible={ops.toggleVisible}
      dir={dir}
      addLabel={t("add.summaryLine")}
      onAdd={() => ops.add(newLine())}
    >
      <ul className="item-list">
        {section.items.map((line, i) => (
          <ItemRow
            key={line.id}
            visible={line.visible}
            matched={matched.has(line.id)}
            isFirst={i === 0}
            isLast={i === section.items.length - 1}
            onToggleVisible={() =>
              ops.patch(i, { ...line, visible: !line.visible })
            }
            onMove={(delta) => ops.move(i, delta)}
            onRemove={() => ops.remove(i)}
          >
            <div className="field-grid">
              <Field
                label={t("line.lead")}
                value={line.lead}
                dir={dir}
                onChange={(lead) => ops.patch(i, { ...line, lead })}
              />
              <Field
                label={t("line.text")}
                value={line.text}
                dir={dir}
                multiline
                rows={2}
                onChange={(text) => ops.patch(i, { ...line, text })}
              />
            </div>
          </ItemRow>
        ))}
      </ul>
    </SectionBlock>
  )
}
