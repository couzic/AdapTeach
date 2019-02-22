import './App.css'

import React, { Component } from 'react'

import logo from './logo.svg'

const clientId = '77z5wn7na1pdp3'
const redirectUri = 'https://adapteach-web.herokuapp.com/auth/linkedin/callback'

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a
            className="App-link"
            href={`https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`}
            target="_blank"
          >
            Login with LinkedIn
          </a>
        </header>
      </div>
    )
  }
}

export default App
