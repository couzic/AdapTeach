import { onLoad } from 'lenrix'
import { pipe } from 'rxjs'
import { filter, map, switchMap } from 'rxjs/operators'

import { CoreDependencies } from '../core/dependencies/CoreDependencies'
import { User } from '../core/domain/User'
import { RootStore } from '../core/RootStore'
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
      setSignedInUser: User
    }>()
    .pureEpics({
      enteredLinkedInCallback: pipe(
        switchMap(({ code }) => authEndpoint.fetchLinkedInToken(code)),
        map(result => ({ receivedToken: result }))
      ),
      receivedToken: map(({ user }) => ({ setSignedInUser: user })) // This is to make sure JWT is stored before any reaction to user change is triggered
    })
    .sideEffects({
      receivedToken: ({ jwt }) => {
        jwtStorage.jwt = jwt
      }
    })
    .updates(_ => ({
      setSignedInUser: _.focusPath('signedInUser').setValue()
    }))
    .sideEffects({
      setSignedInUser: () => router.home.push()
    })

  onLoad(() => {
    router.auth.linkedin.callback.match$
      .pipe(
        filter(match => !!match && match.exact),
        map(match => match!.params.code)
      )
      .subscribe(code => store.dispatch({ enteredLinkedInCallback: { code } }))
  })

  return store
}

export type AuthStore = ReturnType<typeof createAuthStore>
