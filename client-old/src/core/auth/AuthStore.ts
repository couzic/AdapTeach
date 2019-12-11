import { pipe } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'

import { CoreDependencies } from '../CoreDependencies'
import { User } from '../domain/User'
import { RootStore } from '../RootStore'
import { JWT } from './JWT'

export const createAuthStore = (
  rootStore: RootStore,
  { router, authEndpoint, jwtStorage }: CoreDependencies
) => {
  const store = rootStore
    .focusFields('signedInUser')
    .actionTypes<{
      enteredLinkedInCallback: { code: string }
      receivedToken: { jwt: JWT; user: User }
      userSignedIn: User
    }>()
    .pureEpics({
      enteredLinkedInCallback: pipe(
        switchMap(({ code }) => authEndpoint.fetchLinkedInToken(code)),
        map(result => ({ receivedToken: result }))
      ),
      receivedToken: map(({ user }) => ({ userSignedIn: user })) // This is to make sure JWT is stored before any reaction to user change is triggered
    })
    .sideEffects({
      receivedToken: ({ jwt }) => {
        jwtStorage.jwt = jwt
      }
    })
    .updates(_ => ({
      userSignedIn: _.focusPath('signedInUser').setValue()
    }))
    .sideEffects({
      userSignedIn: () => router.home.push()
    })

  return store
}

export type AuthStore = ReturnType<typeof createAuthStore>
