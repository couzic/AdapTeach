import './App.css'

import React from 'react'

import { SignInWithLinkedInButton } from './auth/SignInWithLinkedInButton'
import logo from './logo.png'

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <SignInWithLinkedInButton />
        </header>
      </div>
    )
  }
}

export default App
