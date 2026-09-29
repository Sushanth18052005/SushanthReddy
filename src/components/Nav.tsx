import { useEffect, useRef, useState, type MouseEvent } from 'react'

import { navLinks, profile } from '../data/profile'
import { ScrollTrigger } from '../lib/gsap'
import { lockScroll, scrollToTarget } from '../lib/scroll'

export function Nav({ activeId }: { activeId: string }) {
  const bar = useRef<HTMLSpanElement | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        bar.current?.style.setProperty('transform', `scaleX(${self.progress})`)
        setScrolled(self.scroll() > 60)
      },
    })

    return () => trigger.kill()
  }, [])

  useEffect(() => {
    lockScroll(open)
    return () => lockScroll(false)
  }, [open])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    setOpen(false)
    scrollToTarget(`#${id}`)
    window.history.replaceState(null, '', `#${id}`)
  }

  return (
    <>
      <header className={['nav', scrolled ? 'is-scrolled' : ''].filter(Boolean).join(' ')}>
        <div className="nav__inner shell">
          <a className="nav__mark" href="#top" onClick={(event) => go(event, 'top')} aria-label="Back to top">
            <span className="nav__mono">{profile.monogram}</span>
            <span className="nav__name">{profile.name}</span>
          </a>

          <nav className="nav__links" aria-label="Sections">
            {navLinks.map((link) => (
              <a
                key={link.id}
                className={['nav__link', activeId === link.id ? 'is-active' : ''].filter(Boolean).join(' ')}
                href={`#${link.id}`}
                onClick={(event) => go(event, link.id)}
                aria-current={activeId === link.id ? 'true' : undefined}
              >
                <span className="nav__idx">{link.index}</span>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="nav__end">
            <span className="nav__status">
              <i aria-hidden="true" />
              {profile.status.label}
            </span>
            <a className="btn btn--solid nav__cta" href={profile.resumeUrl} download>
              Résumé
            </a>
            <button className="nav__toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
              {open ? 'Close' : 'Index'}
            </button>
          </div>
        </div>

        <div className="progress" aria-hidden="true">
          <span ref={bar} className="progress__bar" />
        </div>
      </header>

      <div className={['menu', open ? 'is-open' : ''].filter(Boolean).join(' ')} aria-hidden={!open}>
        <nav className="menu__list" aria-label="All sections">
          {navLinks.map((link) => (
            <a key={link.id} className="menu__link" href={`#${link.id}`} onClick={(event) => go(event, link.id)} tabIndex={open ? 0 : -1}>
              {link.label}
              <span className="lab">{link.index}</span>
            </a>
          ))}
        </nav>
        <div className="menu__foot">
          <a className="link-u lab lab--bright" href={profile.github} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
            GitHub
          </a>
          <a className="link-u lab lab--bright" href={profile.linkedin} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
            LinkedIn
          </a>
          <a className="link-u lab lab--bright" href={`mailto:${profile.email}`} tabIndex={open ? 0 : -1}>
            Email
          </a>
        </div>
      </div>
    </>
  )
}
