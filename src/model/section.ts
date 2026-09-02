//? Model
import { moveItem, removeAt, replaceAt } from "./document"
import type { CvSection } from "./types"

export type SectionOps<T> = {
  setTitle: (title: string) => void
  toggleVisible: () => void
  patch: (index: number, item: T) => void
  move: (index: number, delta: number) => void
  remove: (index: number) => void
  add: (item: T) => void
}

/**
 * Every section is edited the same four ways, whatever its entries look like.
 * Stating that once keeps the four section components down to their fields.
 */
export function sectionOps<T>(
  section: CvSection<T>,
  onChange: (next: CvSection<T>) => void,
): SectionOps<T> {
  return {
    setTitle: (title) => onChange({ ...section, title }),
    toggleVisible: () => onChange({ ...section, visible: !section.visible }),
    patch: (index, item) =>
      onChange({ ...section, items: replaceAt(section.items, index, item) }),
    move: (index, delta) =>
      onChange({ ...section, items: moveItem(section.items, index, delta) }),
    remove: (index) =>
      onChange({ ...section, items: removeAt(section.items, index) }),
    add: (item) => onChange({ ...section, items: [...section.items, item] }),
  }
}
