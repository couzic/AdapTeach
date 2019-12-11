import { pipe } from 'rxjs'
import { filter, map, switchMap } from 'rxjs/operators'

import { CoreDependencies } from '../../core/CoreDependencies'
import { Assessment } from '../../core/domain/Assessment'
import { RootStore } from '../../core/RootStore'

export const createHomePageStore = (
  rootStore: RootStore,
  { assessmentEndpoint }: CoreDependencies
) => {
  const store = rootStore
    .actionTypes<{
      enteredHome: void
      receivedNextAssessment: Assessment | null
    }>()
    .pureEpics({
      enteredHome: pipe(
        map(() => rootStore.currentState.signedInUser),
        filter(user => user !== undefined),
        switchMap(user => assessmentEndpoint.fetchNextAssessment(user!.id)),
        map(assessment => ({ receivedNextAssessment: assessment }))
      )
    })
    .updates(_ => ({
      receivedNextAssessment: _.focusPath('nextAssessment').setValue()
    }))
    .computeFromField('signedInUser', user => ({
      alreadySignedIn: user !== undefined
    }))

  return store
}

export type HomePageStore = ReturnType<typeof createHomePageStore>
