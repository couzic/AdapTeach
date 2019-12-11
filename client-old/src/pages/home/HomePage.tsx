import React from 'react'
import { componentFromStream } from 'recompose'
import { map } from 'rxjs/operators'

import { Route } from '../../components/Route'
import { core } from '../../core'
import { NotSignedInHomePage } from './NotSignedInHomePage'
import { SignedInHomePage } from './SignedInHomePage'

// export const HomePage: React.FC = () => {
//   const state = useObservable(() =>
//     core.home.store.pick('signedInUser', 'nextAssessment')
//   )
//   console.log(state)
//   if (state === null) return null
//   const { nextAssessment, signedInUser } = state!
//   const alreadySignedIn = signedInUser !== undefined
//   return (
//     <Route exact matchRouter={core.router.home}>
//       {alreadySignedIn ? <SignedInHomePage /> : <NotSignedInHomePage />}
//       {JSON.stringify(nextAssessment)}
//     </Route>
//   )
// }

export const HomePage = componentFromStream(() =>
  core.home.store.pick('alreadySignedIn', 'nextAssessment').pipe(
    map(({ alreadySignedIn, nextAssessment }) => (
      <Route exact matchRouter={core.router.home}>
        {alreadySignedIn ? <SignedInHomePage /> : <NotSignedInHomePage />}
      </Route>
    ))
  )
)

// => {
//   const state = useObservable(() =>
//     core.home.store.pick('signedInUser', 'nextAssessment')
//   )
//   console.log(state)
//   if (state === null) return null
//   const { nextAssessment, signedInUser } = state!
//   const alreadySignedIn = signedInUser !== undefined
//   return (
//     <Route exact matchRouter={core.router.home}>
//       {alreadySignedIn ? <SignedInHomePage /> : <NotSignedInHomePage />}
//       {JSON.stringify(nextAssessment)}
//     </Route>
//   )
// }
