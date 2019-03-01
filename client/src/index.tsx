import './index.css'

import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'
import { core } from './core'
import * as serviceWorker from './serviceWorker'

// const lastLoggedInWith = window.localStorage.getItem('lastLoggedInWith')

const matchLinkedInCallback =
  core.router.auth.linkedin.callback.currentState.match

if (false) {
} else if (matchLinkedInCallback) {
  // window.localStorage.setItem('lastLoggedInWith', LINKED_IN)
  // const { code } = matchLinkedInCallback.params
  // ajax
  //   .post(
  //     '/auth/linkedin/token',
  //     { code },
  //     { 'Content-Type': 'application/json' }
  //   )
  //   .subscribe(result => {
  //     const { token, user } = result.response
  //     console.log(token)
  //     console.log(user)
  //     core.router.home.push()
  //   })
  // } else if (lastLoggedInWith === LINKED_IN) {
  // window.location.href = window.location.origin + '/auth/linkedin/signin'
}

ReactDOM.render(<App />, document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister()
