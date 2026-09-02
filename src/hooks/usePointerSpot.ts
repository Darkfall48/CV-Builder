//? Libraries
import { useEffect } from "react"

/**
 * Feeds the pointer position to the ambient light layer as CSS custom
 * properties. Written on the root element rather than held in React state:
 * this fires on every pointer move, and a re-render per frame would cost far
 * more than the effect is worth.
 */
export function usePointerSpot() {
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (motion.matches) return

    function onMove(event: PointerEvent) {
      const root = document.documentElement
      root.style.setProperty("--spot-x", `${event.clientX}px`)
      root.style.setProperty("--spot-y", `${event.clientY}px`)
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [])
}
