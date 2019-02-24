import './App.css'

import React, { Component } from 'react'

import logo from './logo.svg'
import signinButton from './signin-button.png'

const clientId = '77z5wn7na1pdp3'
const redirectUri = 'https://adapteach-web.herokuapp.com/auth/linkedin/callback'
const scope = 'r_liteprofile'
const linkedinAuthUrl =
  'https://www.linkedin.com/oauth/v2/authorization?response_type=code' +
  `&client_id=${clientId}` +
  `&redirect_uri=${redirectUri}` +
  `&scope='${scope}`

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a href={linkedinAuthUrl}>
            <img src={signinButton} alt="Sign in with LinkedIn" />
          </a>
        </header>
      </div>
    )
  }
}

export default App
