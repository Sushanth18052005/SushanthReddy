import { useCallback, useEffect, useState } from 'react'

import { Chrome } from './components/Chrome'
import { Contact, Footer } from './components/Contact'
import { Cursor } from './components/Cursor'
import { Experience } from './components/Experience'
import { Hero } from './components/Hero'
import { Nav } from './components/Nav'
import { Patent } from './components/Patent'
import { Preloader } from './components/Preloader'
import { Profile } from './components/Profile'
import { Rail } from './components/Rail'
import { Recognition } from './components/Recognition'
import { Ticker } from './components/Ticker'
import { Toolkit } from './components/Toolkit'
import { Work } from './components/Work'
import { navLinks } from './data/profile'
import { ScrollTrigger } from './lib/gsap'
import { useActiveSection, usePrefersReducedMotion, useRevealEngine } from './lib/hooks'
import { startSmoothScroll, stopSmoothScroll } from './lib/scroll'

/** Stable identity so the section observer is only ever built once. */
const SECTION_IDS = navLinks.map((link) => link.id)

export default function App() {
  const reduced = usePrefersReducedMotion()
  const [loaded, setLoaded] = useState(false)
  const ready = reduced || loaded
  const activeId = useActiveSection(SECTION_IDS)

  const handlePreloaderDone = useCallback(() => setLoaded(true), [])

  useEffect(() => {
    startSmoothScroll()
    return () => stopSmoothScroll()
  }, [])

  // Web fonts change text metrics, which moves every ScrollTrigger start point.
  useEffect(() => {
    if (!ready) return
    let cancelled = false
    const fonts = document.fonts

    const refresh = () => {
      if (!cancelled) ScrollTrigger.refresh()
    }

    if (fonts?.ready) {
      void fonts.ready.then(refresh)
    } else {
      refresh()
    }

    return () => {
      cancelled = true
    }
  }, [ready])

  useRevealEngine(ready)

  return (
    <div className="page">
      <a className="skip" href="#profile">
        Skip to content
      </a>

      {!ready ? <Preloader onDone={handlePreloaderDone} /> : null}

      <Chrome />
      <Cursor />
      <Nav activeId={activeId} />
      <Rail activeId={activeId} />

      <main>
        <Hero />
        <Ticker />
        <Profile />
        <Experience />
        <Patent />
        <Work />
        <Toolkit />
        <Recognition />
        <Contact />
      </main>

      <Footer />
    </div>
  )
}
