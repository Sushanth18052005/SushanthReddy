import { useEffect, useState } from 'react'

import { contact, education, profile } from '../data/profile'
import { Magnetic } from './ui/Magnetic'
import { MaskLines, Reveal, RevealGroup } from './ui/Reveal'
import { SectionHead } from './ui/SectionHead'

function useLocalTime(): string {
  const [time, setTime] = useState('--:--:--')

  useEffect(() => {
    const format = new Intl.DateTimeFormat('en-GB', {
      timeZone: profile.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    const tick = () => setTime(format.format(new Date()))
    tick()
    const id = window.setInterval(tick, 1000)

    return () => window.clearInterval(id)
  }, [])

  return time
}

export function Contact() {
  const time = useLocalTime()
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="contact" id="contact">
      <div className="shell contact__inner">
        <SectionHead index={contact.index} label={contact.label} aside="Response within a day" />

        <MaskLines
          as="h2"
          className="display display--l contact__heading"
          lines={[
            contact.heading[0],
            <em key="accent">{contact.heading[1]}</em>,
          ]}
          stagger={0.1}
        />

        <p className="lede contact__body" data-reveal="fade">
          {contact.body}
        </p>

        <div className="contact__mail">
          <Magnetic strength={0.12}>
            <a className="contact__mail-link" href={`mailto:${profile.email}`} data-cursor="Write to me">
              {profile.email}
              <span className="contact__mail-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </Magnetic>
        </div>

        <RevealGroup className="contact__grid" stagger={0.1}>
          <div className="contact__col">
            <span className="lab">Direct</span>
            <div className="contact__val contact__val--row">
              <a className="link-u" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
              <a className="link-u" href={`tel:${profile.phoneHref}`}>
                {profile.phoneDisplay}
              </a>
            </div>
          </div>

          <div className="contact__col">
            <span className="lab">Elsewhere</span>
            <div className="contact__val contact__val--row">
              <a className="link-u link-u--ember" href={profile.github} target="_blank" rel="noreferrer">
                github.com/Sushanth18052005
              </a>
              <a className="link-u link-u--ember" href={profile.linkedin} target="_blank" rel="noreferrer">
                linkedin.com/in/sushanth-reddy-peddireddy
              </a>
            </div>
          </div>

          <div className="contact__col">
            <span className="lab">Based in</span>
            <div className="contact__val contact__val--row">
              <span>
                {profile.location} — B.Tech {education.short}, class of 2026
              </span>
              <span className="contact__clock">
                {time} <span className="muted">IST</span>
              </span>
            </div>
          </div>
        </RevealGroup>

        <Reveal className="contact__actions" kind="fade">
          <Magnetic>
            <a className="btn btn--solid" href={profile.resumeUrl} download>
              Download résumé
              <span className="btn__arrow" aria-hidden="true">
                ↓
              </span>
            </a>
          </Magnetic>
          <Magnetic strength={0.16}>
            <button className="btn" type="button" onClick={copyEmail} data-cursor={copied ? 'Copied' : 'Copy email'}>
              {copied ? 'Copied to clipboard' : 'Copy email address'}
            </button>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer__row">
        <span>© 2026 {profile.legalName}</span>
        <span className="footer__note">React · Three.js · GSAP — designed and built from scratch</span>
        <a className="footer__top" href="#top" data-cursor="link">
          Back to top ↑
        </a>
      </div>
    </footer>
  )
}
