//? Libraries
import type { ReactNode } from "react"

type Props = {
  index: string
  title: string
  tools?: ReactNode
  children: ReactNode
}

/** A numbered card, one concern each, the way the portfolio panels read. */
export function EditorBlock({ index, title, tools, children }: Props) {
  return (
    <section className="editor-block">
      <header className="editor-block-head">
        <h2 className="editor-block-title hud-title">
          <span className="hud-index" aria-hidden="true">
            {index}
          </span>
          {title}
        </h2>
        {tools ? <div className="editor-block-tools">{tools}</div> : null}
      </header>
      {children}
    </section>
  )
}
