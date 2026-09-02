//? Libraries
import { useEffect, useState } from "react"
import type { RefObject } from "react"

export type PreviewFit = {
  /** Factor the sheet is drawn at, never above 1: paper is not magnified. */
  scale: number
  /** What the scaled sheet occupies in the layout, in pixels. */
  heightPx: number
}

/**
 * A4 is 210mm wide and a side panel is not, so the sheet is scaled down to
 * fit. A transform does not shrink the box it paints in, which would leave the
 * page floating over a column of dead space, so the frame is given the scaled
 * height to hold instead.
 *
 * The preview is deliberately fitted by width only. In layouts where it sits
 * beside the editor, its column owns the vertical scroll: the page therefore
 * stays large enough to read instead of shrinking to leave unused space.
 */
export function usePreviewFit(
  frameRef: RefObject<HTMLElement | null>,
  pageRef: RefObject<HTMLElement | null>,
): PreviewFit {
  const [fit, setFit] = useState<PreviewFit>({ scale: 1, heightPx: 0 })

  useEffect(() => {
    const frame = frameRef.current
    const page = pageRef.current
    if (!frame || !page) return

    const measure = () => {
      const available = frame.clientWidth
      const pageWidth = page.offsetWidth
      if (available <= 0 || pageWidth <= 0) return

      const scale = Math.min(1, available / pageWidth)
      const heightPx = page.offsetHeight * scale

      // Writing the frame's height back is what makes this loop-prone: only
      // commit when something actually moved, or the observer feeds itself.
      setFit((current) =>
        Math.abs(current.scale - scale) < 0.001 &&
        Math.abs(current.heightPx - heightPx) < 0.5
          ? current
          : { scale, heightPx },
      )
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    observer.observe(page)

    return () => observer.disconnect()
  }, [frameRef, pageRef])

  return fit
}
