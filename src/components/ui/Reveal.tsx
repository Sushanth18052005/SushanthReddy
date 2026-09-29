import type { ReactNode } from 'react'

type RevealKind = 'fade' | 'plain' | 'clip'

export function Reveal({
  children,
  className,
  kind = 'fade',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  kind?: RevealKind
  delay?: number
}) {
  return (
    <div className={className} data-reveal={kind} data-reveal-delay={delay}>
      {children}
    </div>
  )
}

/** A container whose direct children reveal in sequence. */
export function RevealGroup({
  children,
  className,
  stagger = 0.1,
}: {
  children: ReactNode
  className?: string
  stagger?: number
}) {
  return (
    <div className={className} data-reveal-group data-reveal-stagger={stagger}>
      {children}
    </div>
  )
}

/**
 * Headline lines that rise out of a mask, one after another. Everything is
 * driven by the global reveal engine, so the markup stays declarative.
 */
export function MaskLines({
  lines,
  className,
  as = 'h2',
  stagger = 0.085,
  delay = 0,
  ariaLabel,
}: {
  lines: readonly ReactNode[]
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p'
  stagger?: number
  delay?: number
  /** Readable name, since the line masks break words across elements. */
  ariaLabel?: string
}) {
  const Tag = as

  return (
    <Tag className={className} aria-label={ariaLabel} data-mask-lines data-mask-stagger={stagger} data-mask-delay={delay}>
      {lines.map((line, index) => (
        <span className="mask" key={index}>
          <span className="mask__inner">{line}</span>
        </span>
      ))}
    </Tag>
  )
}
