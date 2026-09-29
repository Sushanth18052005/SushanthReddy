import { focusAreas, profile, profileSection } from '../data/profile'
import { SectionHead } from './ui/SectionHead'
import { MaskLines, RevealGroup } from './ui/Reveal'

export function Profile() {
  const statement = [
    'I work at the seam between',
    <span className="em-word" key="accent">
      research-grade deep learning
    </span>,
    'and software that actually ships.',
  ]

  return (
    <section className="sec" id="profile">
      <div className="shell">
        <SectionHead index={profileSection.index} label={profileSection.label} aside={profile.location} />

        <div className="profile__grid">
          <MaskLines as="h2" className="display profile__statement" lines={statement} stagger={0.1} />

          <RevealGroup className="profile__body body-text" stagger={0.12}>
            {profileSection.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}

            <div className="profile__signature">
              <span className="profile__signature-mark" aria-hidden="true">
                ✳
              </span>
              <span className="lab lab--bright">
                {profile.discipline} · {profile.status.note} · available for full-time roles
              </span>
            </div>
          </RevealGroup>
        </div>

        <RevealGroup className="focus" stagger={0.1}>
          {focusAreas.map((area) => (
            <article className="focus__card" key={area.index}>
              <span className="lab focus__index">{area.index}</span>
              <h3 className="focus__title">{area.title}</h3>
              <p className="focus__body">{area.body}</p>
              <div className="focus__tags">
                {area.tags.map((tag) => (
                  <span className="focus__tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
