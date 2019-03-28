import React from 'react'
import { useObservable } from 'rxjs-hooks'
import { map } from 'rxjs/operators'

import { Route } from '../../components/Route'
import { core } from '../../core'
import { NotSignedInHomePage } from './NotSignedInHomePage'
import { SignedInHomePage } from './SignedInHomePage'

export const HomePage: React.FC = () => {
  const alreadySignedIn = useObservable(() =>
    core.auth.store
      .pick('signedInUser')
      .pipe(map(({ signedInUser }) => !!signedInUser))
  )
  return (
    <Route exact matchRouter={core.router.home}>
      {alreadySignedIn ? <SignedInHomePage /> : <NotSignedInHomePage />}
    </Route>
  )
}
