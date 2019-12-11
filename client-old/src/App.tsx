import './App.css'

import React from 'react'

import { LinkedInCallbackPage } from './pages/auth/linkedin/callback/LinkedInCallbackPage'
import { HomePage } from './pages/home/HomePage'

const style: React.CSSProperties = {}

class App extends React.Component {
  render() {
    return (
      <div style={style}>
        <HomePage />
        <LinkedInCallbackPage />
      </div>
    )
  }
}

export default App
