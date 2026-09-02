//? Libraries
import { useEffect, useState } from "react"
import type { RefObject } from "react"

/** CSS defines a millimetre as exactly this many pixels, at any zoom level. */
const PX_PER_MM = 96 / 25.4

/**
 * How much of one page the document takes, 1 being exactly full.
 *
 * The portfolio this grew out of estimated the same number from a formula
 * fitted to one template: mean glyph width per language, line boxes, indents
 * in twips. That works for a document whose every line is known in advance. It
 * cannot survive arbitrary text in an arbitrary style, so the measurement here
 * is the layout itself — the browser has already paginated the preview, and it
 * only has to be asked how tall the result came out.
 */
export function usePageFill(
  ref: RefObject<HTMLElement | null>,
  usableHeightMm: number,
): number {
  const [heightPx, setHeightPx] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Arrow rather than a declaration: a hoisted function loses the null check
    // above, since TypeScript cannot tell when it will be called.
    const measure = () => setHeightPx(node.offsetHeight)

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(node)
    // Editing a line reflows the column without resizing the column itself,
    // so the children have to be watched too.
    for (const child of node.children) observer.observe(child)

    return () => observer.disconnect()
  }, [ref, usableHeightMm])

  const usablePx = usableHeightMm * PX_PER_MM
  return usablePx > 0 ? heightPx / usablePx : 0
}
