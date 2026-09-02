//? Libraries
import { useTranslation } from "react-i18next"

//? Components
import { Field } from "./Field"
import { ItemRow } from "./ItemRow"
import { SectionBlock } from "./SectionBlock"

//? Model
import { moveItem, newLine, newRole, removeAt, replaceAt } from "../model/document"
import { sectionOps } from "../model/section"
import type { CvDirection, CvRole, CvSection, Id } from "../model/types"

//? Icons
import { FiPlus } from "react-icons/fi"

type Props = {
  index: string
  section: CvSection<CvRole>
  onChange: (next: CvSection<CvRole>) => void
  dir: CvDirection
  matched: ReadonlySet<Id>
}

export function ExperienceSection({
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
      addLabel={t("add.role")}
      onAdd={() => ops.add(newRole())}
    >
      <ul className="item-list">
        {section.items.map((role, i) => {
          const patchBullets = (bullets: CvRole["bullets"]) =>
            ops.patch(i, { ...role, bullets })

          return (
            <ItemRow
              key={role.id}
              visible={role.visible}
              matched={matched.has(role.id)}
              isFirst={i === 0}
              isLast={i === section.items.length - 1}
              onToggleVisible={() =>
                ops.patch(i, { ...role, visible: !role.visible })
              }
              onMove={(delta) => ops.move(i, delta)}
              onRemove={() => ops.remove(i)}
            >
              <div className="field-grid">
                <Field
                  label={t("line.role")}
                  value={role.title}
                  dir={dir}
                  onChange={(title) => ops.patch(i, { ...role, title })}
                />
                <Field
                  label={t("line.company")}
                  value={role.company}
                  dir={dir}
                  onChange={(company) => ops.patch(i, { ...role, company })}
                />
                <Field
                  label={t("line.period")}
                  value={role.period}
                  dir={dir}
                  onChange={(period) => ops.patch(i, { ...role, period })}
                />
                <Field
                  label={t("line.location")}
                  value={role.location}
                  dir={dir}
                  onChange={(location) => ops.patch(i, { ...role, location })}
                />
              </div>

              {/* Bullets are entries in their own right: they reorder, hide and
                  delete like any other line, just one level in. */}
              <ul className="item-list is-nested">
                {role.bullets.map((bullet, b) => (
                  <ItemRow
                    key={bullet.id}
                    visible={bullet.visible}
                    matched={matched.has(bullet.id)}
                    isFirst={b === 0}
                    isLast={b === role.bullets.length - 1}
                    onToggleVisible={() =>
                      patchBullets(
                        replaceAt(role.bullets, b, {
                          ...bullet,
                          visible: !bullet.visible,
                        }),
                      )
                    }
                    onMove={(delta) =>
                      patchBullets(moveItem(role.bullets, b, delta))
                    }
                    onRemove={() => patchBullets(removeAt(role.bullets, b))}
                  >
                    <div className="field-grid">
                      <Field
                        label={t("line.lead")}
                        value={bullet.lead}
                        dir={dir}
                        onChange={(lead) =>
                          patchBullets(
                            replaceAt(role.bullets, b, { ...bullet, lead }),
                          )
                        }
                      />
                      <Field
                        label={t("line.text")}
                        value={bullet.text}
                        dir={dir}
                        multiline
                        rows={2}
                        onChange={(text) =>
                          patchBullets(
                            replaceAt(role.bullets, b, { ...bullet, text }),
                          )
                        }
                      />
                    </div>
                  </ItemRow>
                ))}
              </ul>

              <button
                type="button"
                className="item-row-add"
                onClick={() => patchBullets([...role.bullets, newLine()])}
              >
                <FiPlus aria-hidden="true" />
                <span>{t("add.bullet")}</span>
              </button>
            </ItemRow>
          )
        })}
      </ul>
    </SectionBlock>
  )
}
