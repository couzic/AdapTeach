import { createHomePageStore } from '../pages/home/HomePageStore'
import { createAuthStore } from './auth/AuthStore'
import { CoreDependencies } from './CoreDependencies'
import { createRootStore } from './RootStore'

export const createCore = (dependencies: CoreDependencies) => {
  const { router } = dependencies
  const rootStore = createRootStore()
  return {
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
}

export type Core = ReturnType<typeof createCore>
