import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// No StrictMode: the embedded terminal (xterm.js + a live PTY/WebSocket) is an
// imperative, stateful integration that doesn't tolerate StrictMode's dev-mode
// double-mount — see Terminal.tsx.
createRoot(document.getElementById('root')!).render(<App />)
