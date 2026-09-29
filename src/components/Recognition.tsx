import { recognition } from '../data/profile'
import { MaskLines, RevealGroup } from './ui/Reveal'
import { SectionHead } from './ui/SectionHead'

export function Recognition() {
  return (
    <section className="sec sec--edge" id="recognition">
      <div className="shell">
        <SectionHead index={recognition.index} label={recognition.label} aside="Awards & community" />

        <RevealGroup className="rec__list" stagger={0.09}>
          {recognition.awards.map((award) => (
            <div className="rec__row" key={award.title}>
              <span className="lab rec__year">{award.year}</span>
              <h3 className="rec__title">{award.title}</h3>
              <span className="rec__detail">{award.detail}</span>
            </div>
          ))}
        </RevealGroup>

        <div className="lead">
          <div>
            <MaskLines
              as="h3"
              className="display display--s"
              lines={['Leadership &', 'community']}
              stagger={0.08}
            />
          </div>

          <RevealGroup className="lead__list" stagger={0.1}>
            {recognition.leadership.map((item) => (
              <div className="lead__item" key={item.title}>
                <h4 className="lead__title">{item.title}</h4>
                <p className="lead__detail">{item.detail}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  )
}
