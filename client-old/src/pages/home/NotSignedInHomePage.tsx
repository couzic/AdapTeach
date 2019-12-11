import React from 'react'

import { SignInWithLinkedInButton } from './SignInWithLinkedInButton'
import { CenteredCard } from '../../components/CenteredCard'
import logo from '../../logo.png'

const style: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
}

export const NotSignedInHomePage: React.FC = () => (
  <div style={style}>
    <CenteredCard>
      <img src={logo} className="App-logo" alt="logo" />
    </CenteredCard>
    <SignInWithLinkedInButton />
  </div>
)
