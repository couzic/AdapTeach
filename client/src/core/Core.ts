import { createAuthStore } from '../auth/AuthStore'
import { CoreDependencies } from './dependencies/CoreDependencies'
import { createRootStore } from './RootStore'

export const createCore = (dependencies: CoreDependencies) => {
  const { router } = dependencies
  const rootStore = createRootStore()
  return {
    router,
    auth: {
      providers: dependencies.authProviders,
      store: createAuthStore(rootStore, dependencies)
    }
  }
}

export type Core = ReturnType<typeof createCore>
