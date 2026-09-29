import { lazy, Suspense, useEffect, useRef } from 'react'

import { projects, type Project } from '../data/profile'
import { gsap } from '../lib/gsap'
import { useInView } from '../lib/hooks'
import { MaskLines, Reveal } from './ui/Reveal'
import { SectionHead } from './ui/SectionHead'

const ProjectStage = lazy(() => import('../three/ProjectStage').then((module) => ({ default: module.ProjectStage })))

function WorkPanel({ project, progress }: { project: Project; progress: React.RefObject<number> }) {
  const [viewerRef, viewerVisible] = useInView<HTMLDivElement>({ rootMargin: '220px', once: false })

  return (
    <article className="work__panel">
      <div className="work__viewer" ref={viewerRef}>
        <Suspense fallback={null}>
          <ProjectStage scene={project.scene} progress={progress} visible={viewerVisible} />
        </Suspense>

        <span className="work__viewer-corner work__viewer-corner--tl" aria-hidden="true" />
        <span className="work__viewer-corner work__viewer-corner--tr" aria-hidden="true" />
        <span className="work__viewer-corner work__viewer-corner--bl" aria-hidden="true" />
        <span className="work__viewer-corner work__viewer-corner--br" aria-hidden="true" />

        <span className="work__viewer-tag">
          {project.kind} · {project.year}
        </span>
      </div>

      <div className="work__copy">
        <span className="lab lab--ember">
          {project.year} — {project.kind}
        </span>
        <h3 className="work__name">{project.name}</h3>
        <p className="work__summary">{project.summary}</p>

        <ul className="work__points">
          {project.points.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>

        <div className="chips">
          {project.stack.map((item) => (
            <span className="chip" key={item}>
              {item}
            </span>
          ))}
        </div>
      </div>

      <aside className="work__spec">
        <span className="lab">Specification</span>

        <dl>
          {project.spec.map((row) => (
            <div className="work__spec-row" key={row.k}>
              <dt>{row.k}</dt>
              <dd>{row.v}</dd>
            </div>
          ))}
        </dl>

        <a
          className="btn"
          href={project.repo}
          target="_blank"
          rel="noreferrer"
          data-cursor={`Open ${project.repoLabel}`}
        >
          GitHub
          <span className="btn__arrow" aria-hidden="true">
            ↗
          </span>
        </a>
      </aside>
    </article>
  )
}

export function Work() {
  const section = useRef<HTMLElement | null>(null)
  const pin = useRef<HTMLDivElement | null>(null)
  const track = useRef<HTMLDivElement | null>(null)
  const bar = useRef<HTMLSpanElement | null>(null)
  const counter = useRef<HTMLElement | null>(null)
  const progress = useRef(0)

  useEffect(() => {
    const sectionEl = section.current
    const pinEl = pin.current
    const trackEl = track.current
    if (!sectionEl || !pinEl || !trackEl) return

    const media = gsap.matchMedia()

    media.add('(min-width: 961px)', () => {
      const distance = () => Math.max(0, trackEl.scrollWidth - window.innerWidth)

      const tween = gsap.to(trackEl, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pinEl,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progress.current = self.progress
            bar.current?.style.setProperty('transform', `scaleX(${self.progress})`)
            if (counter.current) {
              const index = Math.min(projects.length, Math.floor(self.progress * projects.length) + 1)
              counter.current.textContent = String(index).padStart(2, '0')
            }
          },
        },
      })

      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
        gsap.set(trackEl, { x: 0 })
      }
    })

    return () => media.revert()
  }, [])

  return (
    <section className="work" id="work" ref={section}>
      <div className="shell work__head">
        <SectionHead index="04" label="Selected work" aside={`${projects.length} projects`} />
        <MaskLines
          as="h2"
          className="display display--l work__title"
          lines={['Systems that had to work', 'outside the notebook.']}
          stagger={0.1}
        />
      </div>

      <div className="work__pin" ref={pin}>
        <div className="shell work__railbar">
          <span className="lab work__count">
            <b ref={counter}>01</b> / {String(projects.length).padStart(2, '0')}
          </span>
          <span className="work__bar" aria-hidden="true">
            <span ref={bar} />
          </span>
          <span className="drag-hint">
            <i aria-hidden="true" />
            Scroll to traverse
          </span>
        </div>

        <div className="work__track" ref={track}>
          {projects.map((project) => (
            <WorkPanel key={project.id} project={project} progress={progress} />
          ))}
        </div>
      </div>

      <Reveal className="shell work__outro" kind="fade">
        <hr className="rule" data-rule />
        <p className="muted">
          Each project repository lives on{' '}
          <a
            className="link-u link-u--ember"
            href="https://github.com/Sushanth18052005"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          . Source for the two medical projects is private while the patent is under examination — happy to walk
          through the architecture on a call.
        </p>
      </Reveal>
    </section>
  )
}
