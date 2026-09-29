import { lazy, Suspense } from 'react'

import { toolkit } from '../data/profile'
import { useInView } from '../lib/hooks'
import { MaskLines, RevealGroup } from './ui/Reveal'
import { SectionHead } from './ui/SectionHead'

const ToolkitOrb = lazy(() => import('../three/ToolkitOrb').then((module) => ({ default: module.ToolkitOrb })))

export function Toolkit() {
  const [orbRef, orbVisible] = useInView<HTMLDivElement>({ rootMargin: '180px', once: false })

  return (
    <section className="sec sec--edge" id="toolkit">
      <div className="shell">
        <SectionHead index={toolkit.index} label={toolkit.label} aside="6 groups" />

        <div className="toolkit__grid">
          <div>
            <MaskLines
              as="h2"
              className="display display--m toolkit__title"
              lines={['A stack chosen for', 'shipping, not for slides.']}
              stagger={0.09}
            />

            <div className="toolkit__groups">
              {toolkit.groups.map((group) => (
                <div className="tgroup" key={group.title}>
                  <div className="tgroup__head">
                    <h3 className="lab lab--bright">{group.title}</h3>
                    <span className="lab">{String(group.items.length).padStart(2, '0')}</span>
                  </div>
                  <RevealGroup className="tgroup__list" stagger={0.04}>
                    {group.items.map((item) => (
                      <span className="tgroup__item" key={item}>
                        {item}
                      </span>
                    ))}
                  </RevealGroup>
                </div>
              ))}
            </div>
          </div>

          <div className="toolkit__orb" ref={orbRef} aria-hidden="true">
            <Suspense fallback={null}>
              <ToolkitOrb visible={orbVisible} />
            </Suspense>
            <span className="toolkit__orb-note">Toolkit · live render</span>
          </div>
        </div>
      </div>
    </section>
  )
}
