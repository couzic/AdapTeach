import { onLoad } from 'lenrix'
import { filter, map } from 'rxjs/operators'

import { CoreDependencies } from '../../core/dependencies/CoreDependencies'
import { RootStore } from '../../core/RootStore'

export const createHomePageStore = (
  rootStore: RootStore,
  dependencies: CoreDependencies
) => {
  const store = rootStore
  onLoad(() => {
    const enteredHome$ = dependencies.router.home.match$.pipe(
      filter(match => match !== null && match.exact)
    )
    const enteredHomeWhileSignedIn = enteredHome$.pipe(
      map(() => rootStore.currentState.signedInUser),
      filter(signedInUser => signedInUser !== undefined)
    )
    enteredHomeWhileSignedIn.subscribe(signedInUser =>
      dependencies.assessmentEndpoint.fetchNextAssessment(signedInUser!.id)
    )
  })

  return store
}

export type HomePageStore = ReturnType<typeof createHomePageStore>
