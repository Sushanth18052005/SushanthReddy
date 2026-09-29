import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource-variable/inter'
import '@fontsource-variable/fraunces/standard.css'
import '@fontsource-variable/jetbrains-mono'

import './index.css'
import App from './App'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root container #root was not found in the document.')
}

/* Reveal primitives hide content until GSAP animates it in. Flagging the root
 * first means the hide only ever applies when JavaScript is actually running. */
document.documentElement.classList.add('js-ready')

const prefersReducedMotion =
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (prefersReducedMotion) {
  document.documentElement.classList.add('reduced-motion')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
