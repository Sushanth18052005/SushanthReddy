export function SectionHead({ index, label, aside }: { index: string; label: string; aside?: string }) {
  return (
    <div className="sec__head" data-reveal="plain">
      <span className="lab sec__index">{index}</span>
      <hr className="rule" data-rule />
      <span className="lab lab--bright">{label}</span>
      {aside ? <span className="lab muted">{aside}</span> : null}
    </div>
  )
}
