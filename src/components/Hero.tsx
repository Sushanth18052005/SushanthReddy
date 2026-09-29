import { lazy, Suspense, type MouseEvent } from 'react'

import { hero, heroStats } from '../data/profile'
import { useInView, useScrollProgressRef } from '../lib/hooks'
import { scrollToTarget } from '../lib/scroll'
import { Magnetic } from './ui/Magnetic'
import { MaskLines, RevealGroup } from './ui/Reveal'

/* three.js is fetched in its own chunk so the type and layout paint first. */
const HeroField = lazy(() => import('../three/HeroField').then((module) => ({ default: module.HeroField })))

export function Hero() {
  const [sectionRef, progress] = useScrollProgressRef<HTMLElement>('top top', 'bottom top')
  const [canvasRef, canvasVisible] = useInView<HTMLDivElement>({ rootMargin: '140px', once: false })

  const jump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    scrollToTarget(`#${id}`)
  }

  return (
    <section className="hero" id="top" ref={sectionRef}>
      <div className="hero__canvas" ref={canvasRef} aria-hidden="true">
        <Suspense fallback={null}>
          <HeroField progress={progress} visible={canvasVisible} />
        </Suspense>
      </div>

      <div className="hero__grid shell">
        <div className="hero__lead">
          <p className="lab hero__eyebrow" data-reveal="fade" data-reveal-delay="0.15">
            {hero.eyebrow}
          </p>

          <MaskLines
            as="h1"
            className="display display--xl hero__title"
            lines={[
              hero.titleLines[0],
              <>
                {hero.titleLines[1]}
                <span className="hero__dot">.</span>
              </>,
            ]}
            stagger={0.11}
            ariaLabel="Sushanth Reddy"
          />
        </div>

        <div className="hero__aside">
          <MaskLines as="p" className="display display--m hero__statement" lines={[hero.statement]} delay={0.35} />

          <p className="hero__standfirst" data-reveal="fade" data-reveal-delay="0.5">
            {hero.standfirst}
          </p>

          <RevealGroup className="hero__actions" stagger={0.08}>
            <Magnetic>
              <a className="btn btn--solid" href="#work" onClick={(event) => jump(event, 'work')}>
                Selected work
                <span className="btn__arrow" aria-hidden="true">
                  ↓
                </span>
              </a>
            </Magnetic>
            <Magnetic strength={0.18}>
              <a
                className="btn"
                href="#patent"
                onClick={(event) => jump(event, 'patent')}
                data-cursor="Patent 202541059395 A"
              >
                The patent
              </a>
            </Magnetic>
          </RevealGroup>
        </div>
      </div>

      <div className="hero__foot shell">
        <ul className="hero__stats" data-reveal-group data-reveal-stagger="0.12">
          {heroStats.map((stat) => (
            <li className="hero__stat" key={stat.label}>
              <span className="hero__stat-v">
                {stat.value}
                <small>{stat.unit}</small>
              </span>
              <span className="hero__stat-lab">{stat.label}</span>
              <span className="hero__stat-detail">{stat.detail}</span>
            </li>
          ))}
        </ul>

        <a
          className="hero__scroll"
          href="#profile"
          onClick={(event) => jump(event, 'profile')}
          data-cursor="link"
          aria-label="Scroll to profile"
        >
          <span className="hero__scroll-line" aria-hidden="true" />
          <span className="lab">Scroll</span>
        </a>
      </div>
    </section>
  )
}
