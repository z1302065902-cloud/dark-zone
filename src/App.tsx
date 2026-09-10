import { useEffect } from 'react'
import { Game } from './components/Game'
import { useGameStore } from './stores/gameStore'
import './styles/game.css'

// Dev-only bridge for automated testing (enabled via ?debug=1 or ?demo=1, harmless in prod)
if (new URLSearchParams(window.location.search).has('debug') || new URLSearchParams(window.location.search).has('demo')) {
  ;(window as any).__dz = {
    store: useGameStore,
    getState: () => useGameStore.getState(),
  }
  // Expose THREE for debug raycasts
  import('three').then((m) => {
    ;(window as any).__dz.THREE = m
  })
  // Expose collider registry for debugging
  import('./components/environment/collision').then((m) => {
    ;(window as any).__dz.colliders = () =>
      m.colliders.map((c) => ({ minX: c.minX, maxX: c.maxX, minZ: c.minZ, maxZ: c.maxZ, active: c.active }))
  })
  // Expose fireWeapon for E2E testing
  ;(window as any).__dz.fireWeapon = () => {
    window.dispatchEvent(new CustomEvent('dz:fire-weapon'))
  }
}

function App() {
  // Request pointer lock on canvas click
  useEffect(() => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.addEventListener('click', () => {
        canvas.requestPointerLock()
      })
    }
    
    // Prevent context menu
    const preventContext = (e: MouseEvent) => e.preventDefault()
    window.addEventListener('contextmenu', preventContext)
    
    return () => {
      window.removeEventListener('contextmenu', preventContext)
    }
  }, [])
  
  return <Game />
}

export default App