import { filter, map } from 'rxjs/operators'

import { createHomePageStore } from '../pages/home/HomePageStore'
import { createAuthStore } from './auth/AuthStore'
import { CoreDependencies } from './CoreDependencies'
import { createRootStore } from './RootStore'

export const createCore = (dependencies: CoreDependencies) => {
  const { router } = dependencies
  const rootStore = createRootStore().onActivate(store => {
    router.home.match$
      .pipe(filter(match => match !== null && match.exact))
      .subscribe(() => core.home.store.dispatch({ enteredHome: undefined }))
    router.auth.linkedin.callback.match$
      .pipe(
        filter(match => !!match && match.exact),
        map(match => match!.params.code)
      )
      .subscribe(code =>
        core.auth.store.dispatch({ enteredLinkedInCallback: { code } })
      )
  })
  const core = {
    dependencies,
    router,
    home: {
      store: createHomePageStore(rootStore, dependencies)
    },
    auth: {
      providers: dependencies.authProviders,
      store: createAuthStore(rootStore, dependencies)
    }
  }
  rootStore.activate()
  return core
}

export type Core = ReturnType<typeof createCore>
