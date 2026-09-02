//? Libraries
import { useTranslation } from "react-i18next"

//? Components
import { Field } from "./Field"
import { ItemRow } from "./ItemRow"
import { SectionBlock } from "./SectionBlock"

//? Model
import { newSkillGroup } from "../model/document"
import { sectionOps } from "../model/section"
import type { CvDirection, CvSection, CvSkillGroup, Id } from "../model/types"

type Props = {
  index: string
  section: CvSection<CvSkillGroup>
  onChange: (next: CvSection<CvSkillGroup>) => void
  dir: CvDirection
  matched: ReadonlySet<Id>
}

export function SkillsSection({
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
      addLabel={t("add.skillGroup")}
      onAdd={() => ops.add(newSkillGroup())}
    >
      <ul className="item-list">
        {section.items.map((group, i) => (
          <ItemRow
            key={group.id}
            visible={group.visible}
            matched={matched.has(group.id)}
            isFirst={i === 0}
            isLast={i === section.items.length - 1}
            onToggleVisible={() =>
              ops.patch(i, { ...group, visible: !group.visible })
            }
            onMove={(delta) => ops.move(i, delta)}
            onRemove={() => ops.remove(i)}
          >
            <div className="field-grid">
              <Field
                label={t("line.skillLabel")}
                value={group.label}
                dir={dir}
                onChange={(label) => ops.patch(i, { ...group, label })}
              />
              <Field
                label={t("line.skillItems")}
                value={group.items}
                dir={dir}
                multiline
                rows={2}
                spellCheck={false}
                onChange={(items) => ops.patch(i, { ...group, items })}
              />
            </div>
          </ItemRow>
        ))}
      </ul>
    </SectionBlock>
  )
}
