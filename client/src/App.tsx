import './App.css'

import React, { Component } from 'react'

import logo from './logo.svg'
import signinButton from './signin-button.png'

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a href="/auth/linkedin/signin">
            <img src={signinButton} alt="Sign in with LinkedIn" />
          </a>
        </header>
      </div>
    )
  }
}

export default App
