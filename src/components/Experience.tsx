import { education, experience } from '../data/profile'
import { MaskLines, Reveal, RevealGroup } from './ui/Reveal'
import { SectionHead } from './ui/SectionHead'

export function Experience() {
  return (
    <section className="sec sec--edge" id="experience">
      <div className="shell">
        <SectionHead index="02" label="Experience" aside={education.short} />

        <div className="exp">
          {experience.map((role) => (
            <article className="exp__item" key={role.company}>
              <div className="exp__meta">
                <span className="exp__period">{role.period}</span>
                <span className="exp__live">
                  <i aria-hidden="true" />
                  Current
                </span>
                <span className="lab">{role.location}</span>
              </div>

              <div className="exp__main">
                <MaskLines as="h3" className="exp__company" lines={[role.company]} stagger={0.06} />

                <div className="exp__role">
                  <span className="lab lab--ember">{role.role}</span>
                  <span className="exp__role-sep" aria-hidden="true" />
                  <span className="lab">Model engineering &amp; evaluation</span>
                </div>

                <p className="body-text">{role.summary}</p>

                <RevealGroup className="exp__points" stagger={0.09}>
                  {role.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </RevealGroup>

                <Reveal className="exp__highlight" kind="fade">
                  <span className="lab lab--bright">Shipped inside the role</span>
                  <h4 className="exp__highlight-title">{role.highlight.title}</h4>
                  <p>{role.highlight.body}</p>
                </Reveal>
              </div>
            </article>
          ))}
        </div>

        <div className="edu">
          <div className="exp__meta">
            <span className="lab lab--bright">Education</span>
            <span className="exp__period">{education.period}</span>
          </div>

          <div className="edu__right">
            <h3 className="edu__school">{education.school}</h3>

            <p className="edu__degree">
              {education.degree}
              <br />
              <span className="muted">Specialisation in {education.specialisation}</span>
            </p>

            <div className="edu__score" data-reveal="fade">
              <span className="lab">{education.scoreLabel}</span>
              <b>{education.score}</b>
            </div>

            <RevealGroup className="chips" stagger={0.05}>
              {education.coursework.map((course) => (
                <span className="chip" key={course}>
                  {course}
                </span>
              ))}
            </RevealGroup>
          </div>
        </div>
      </div>
    </section>
  )
}
