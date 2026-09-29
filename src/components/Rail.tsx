import { type MouseEvent } from 'react'

import { navLinks } from '../data/profile'
import { scrollToTarget } from '../lib/scroll'

export function Rail({ activeId }: { activeId: string }) {
  const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    scrollToTarget(`#${id}`)
    window.history.replaceState(null, '', `#${id}`)
  }

  return (
    <nav className="rail" aria-label="Section index">
      {navLinks.map((link) => (
        <div key={link.id} className={['rail__item', activeId === link.id ? 'is-active' : ''].filter(Boolean).join(' ')}>
          <a href={`#${link.id}`} onClick={(event) => go(event, link.id)}>
            <span className="rail__label">{link.label}</span>
            <span className="rail__dot" aria-hidden="true" />
          </a>
        </div>
      ))}
    </nav>
  )
}
