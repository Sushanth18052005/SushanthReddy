import { lazy, Suspense } from 'react'

import { patent } from '../data/profile'
import { useInView, useScrollProgressRef } from '../lib/hooks'
import { MaskLines, Reveal, RevealGroup } from './ui/Reveal'
import { SectionHead } from './ui/SectionHead'

const VolumeScan = lazy(() => import('../three/VolumeScan').then((module) => ({ default: module.VolumeScan })))

export function Patent() {
  const [sectionRef, progress] = useScrollProgressRef<HTMLElement>('top bottom', 'bottom top')
  const [canvasRef, canvasVisible] = useInView<HTMLDivElement>({ rootMargin: '160px', once: false })

  const record = [
    { term: 'Application no.', value: patent.applicationNo, mono: true },
    { term: 'Filed', value: patent.filed, mono: false },
    { term: 'Published', value: patent.published, mono: false },
    { term: 'Jurisdiction', value: `${patent.jurisdiction} · ${patent.association}`, mono: false },
    { term: 'Role', value: patent.role, mono: false },
  ]

  return (
    <section className="patent" id="patent" ref={sectionRef}>
      <div className="patent__canvas" ref={canvasRef} aria-hidden="true">
        <Suspense fallback={null}>
          <VolumeScan progress={progress} visible={canvasVisible} />
        </Suspense>
      </div>

      <div className="shell patent__inner">
        <SectionHead index={patent.index} label={patent.label} aside={patent.jurisdiction} />

        <div className="patent__grid">
          <div className="patent__copy">
            <span className="patent__badge" data-reveal="fade">
              {patent.eyebrow}
            </span>

            <MaskLines as="h2" className="display patent__title" lines={[patent.title]} stagger={0.06} />

            <p className="lede" data-reveal="fade">
              {patent.intro}
            </p>

            <dl className="patent__record" data-reveal-group data-reveal-stagger="0.07">
              {record.map((row) => (
                <div className="record__row" key={row.term}>
                  <dt>{row.term}</dt>
                  <dd className={row.mono ? 'mono' : undefined}>{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="patent__actions">
              <Reveal kind="fade">
                <a
                  className="btn"
                  href={patent.verifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="Search IP India"
                >
                  {patent.verifyLabel}
                  <span className="btn__arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </Reveal>

              <Reveal kind="fade" delay={0.1}>
                <a className="btn btn--quiet" href="#work" data-cursor="link">
                  See the project
                  <span className="btn__arrow" aria-hidden="true">
                    →
                  </span>
                </a>
              </Reveal>
            </div>
          </div>

          {/* The WebGL volume floats in this column on wide screens. */}
          <div className="patent__spacer" aria-hidden="true" />
        </div>

        <RevealGroup className="stages" stagger={0.12}>
          {patent.stages.map((stage) => (
            <article className="stage" key={stage.key}>
              <div className="stage__no">
                <span className="lab">{stage.no}</span>
                <span className="stage__key">{stage.key}</span>
              </div>
              <h3 className="stage__title">{stage.title}</h3>
              <p className="stage__body">{stage.body}</p>
              <div className="stage__stack">
                {stage.stack.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
