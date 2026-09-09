import { useEffect } from 'react'
import { Game } from './components/Game'
import './styles/game.css'

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