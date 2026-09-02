//? Libraries
import { useTranslation } from "react-i18next"

//? Components
import { Field } from "./Field"
import { ItemRow } from "./ItemRow"
import { SectionBlock } from "./SectionBlock"

//? Model
import { newEducationEntry } from "../model/document"
import { sectionOps } from "../model/section"
import type {
  CvDirection,
  CvEducationEntry,
  CvSection,
  Id,
} from "../model/types"

type Props = {
  index: string
  section: CvSection<CvEducationEntry>
  onChange: (next: CvSection<CvEducationEntry>) => void
  dir: CvDirection
  matched: ReadonlySet<Id>
}

export function EducationSection({
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
      addLabel={t("add.education")}
      onAdd={() => ops.add(newEducationEntry())}
    >
      <ul className="item-list">
        {section.items.map((entry, i) => (
          <ItemRow
            key={entry.id}
            visible={entry.visible}
            matched={matched.has(entry.id)}
            isFirst={i === 0}
            isLast={i === section.items.length - 1}
            onToggleVisible={() =>
              ops.patch(i, { ...entry, visible: !entry.visible })
            }
            onMove={(delta) => ops.move(i, delta)}
            onRemove={() => ops.remove(i)}
          >
            <div className="field-grid">
              <Field
                label={t("line.period")}
                value={entry.period}
                dir={dir}
                onChange={(period) => ops.patch(i, { ...entry, period })}
              />
              <Field
                label={t("line.degree")}
                value={entry.title}
                dir={dir}
                onChange={(title) => ops.patch(i, { ...entry, title })}
              />
              <Field
                label={t("line.school")}
                value={entry.school}
                dir={dir}
                wide
                onChange={(school) => ops.patch(i, { ...entry, school })}
              />
            </div>
          </ItemRow>
        ))}
      </ul>
    </SectionBlock>
  )
}
