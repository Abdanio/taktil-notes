import React from 'react'
import ReactDOM from 'react-dom/client'
import { NotesProvider } from './context/NotesContext'
import { AppContent } from './App'
import 'katex/dist/katex.min.css'
import './globals.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <NotesProvider>
      <AppContent />
    </NotesProvider>
  </React.StrictMode>
)
