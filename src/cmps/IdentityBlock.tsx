//? Libraries
import { useTranslation } from "react-i18next"

//? Components
import { EditorBlock } from "./EditorBlock"
import { Field } from "./Field"

//? Model
import { newId, removeAt, replaceAt } from "../model/document"
import type { CvDirection, CvIdentity } from "../model/types"

//? Icons
import { FiPlus, FiTrash2 } from "react-icons/fi"

type Props = {
  index: string
  identity: CvIdentity
  onChange: (next: CvIdentity) => void
  dir: CvDirection
}

export function IdentityBlock({ index, identity, onChange, dir }: Props) {
  const { t } = useTranslation()
  const patch = (part: Partial<CvIdentity>) => onChange({ ...identity, ...part })
  const toggle = (field: keyof CvIdentity["visibility"]) =>
    patch({
      visibility: {
        ...identity.visibility,
        [field]: !identity.visibility[field],
      },
    })
  const visibilityLabel = (visible: boolean) =>
    visible ? t("action.hide") : t("action.show")

  return (
    <EditorBlock index={index} title={t("identity.title")}>
      <div className="field-grid">
        <Field
          label={t("identity.name")}
          value={identity.name}
          dir={dir}
          onChange={(name) => patch({ name })}
        />
        <Field
          label={t("identity.headline")}
          value={identity.headline}
          placeholder={t("identity.headlinePlaceholder")}
          dir={dir}
          visible={identity.visibility.headline}
          visibilityLabel={visibilityLabel(identity.visibility.headline)}
          onToggleVisible={() => toggle("headline")}
          onChange={(headline) => patch({ headline })}
        />
        <Field
          label={t("identity.email")}
          value={identity.email}
          type="email"
          spellCheck={false}
          visible={identity.visibility.email}
          visibilityLabel={visibilityLabel(identity.visibility.email)}
          onToggleVisible={() => toggle("email")}
          onChange={(email) => patch({ email })}
        />
        <Field
          label={t("identity.phone")}
          value={identity.phone}
          type="tel"
          spellCheck={false}
          visible={identity.visibility.phone}
          visibilityLabel={visibilityLabel(identity.visibility.phone)}
          onToggleVisible={() => toggle("phone")}
          onChange={(phone) => patch({ phone })}
        />
        <Field
          label={t("identity.location")}
          value={identity.location}
          dir={dir}
          visible={identity.visibility.location}
          visibilityLabel={visibilityLabel(identity.visibility.location)}
          onToggleVisible={() => toggle("location")}
          onChange={(location) => patch({ location })}
        />
      </div>

      <div className="link-list">
        <p className="hud-label">{t("identity.links")}</p>
        {identity.links.map((link, i) => (
          <div key={link.id} className="link-row">
            <Field
              label={t("identity.linkLabel")}
              value={link.label}
              spellCheck={false}
              onChange={(label) =>
                patch({ links: replaceAt(identity.links, i, { ...link, label }) })
              }
            />
            <Field
              label={t("identity.linkUrl")}
              value={link.url}
              type="url"
              spellCheck={false}
              onChange={(url) =>
                patch({ links: replaceAt(identity.links, i, { ...link, url }) })
              }
            />
            <button
              type="button"
              className="item-row-tool is-danger"
              title={t("action.remove")}
              aria-label={t("action.remove")}
              onClick={() => patch({ links: removeAt(identity.links, i) })}
            >
              <FiTrash2 aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="editor-block-add"
          onClick={() =>
            patch({
              links: [...identity.links, { id: newId(), label: "", url: "" }],
            })
          }
        >
          <FiPlus aria-hidden="true" />
          <span>{t("identity.addLink")}</span>
        </button>
      </div>
    </EditorBlock>
  )
}
