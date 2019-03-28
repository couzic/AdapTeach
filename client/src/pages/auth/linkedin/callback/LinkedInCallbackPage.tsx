import React from 'react'

import { Route } from '../../../../components/Route'
import { core } from '../../../../core'

const style: React.CSSProperties = {}

export const LinkedInCallbackPage = () => (
  <Route matchRouter={core.router.auth.linkedin.callback}>
    <div style={style}>Signing in with LinkedIn...</div>
  </Route>
)
