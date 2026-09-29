import { marqueeStack } from '../data/profile'

export function Ticker() {
  const first = marqueeStack.slice(0, 11)
  const second = marqueeStack.slice(11)

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__row">
        <div className="ticker__track">
          {[0, 1].map((pass) =>
            first.map((item, index) => (
              <span className="ticker__item" key={`a-${pass}-${index}`}>
                {item}
              </span>
            )),
          )}
        </div>
      </div>

      <div className="ticker__row ticker__row--rev">
        <div className="ticker__track">
          {[0, 1].map((pass) =>
            second.map((item, index) => (
              <span className="ticker__item" key={`b-${pass}-${index}`}>
                {item}
              </span>
            )),
          )}
        </div>
      </div>
    </div>
  )
}
