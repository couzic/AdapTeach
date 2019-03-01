import { createMemoryHistory } from 'history'
import { never } from 'rxjs'

import { AuthProviders } from '../../auth/AuthProviders'
import { JwtStorage } from '../../auth/JwtStorage'
import { createRouter } from '../Router'
import { CoreDependencies } from './CoreDependencies'

export const createTestDependencies = (
  dependencies: Partial<CoreDependencies> = {}
): CoreDependencies => {
  const history = createMemoryHistory()
  const router = createRouter(history)
  const authEndpoint = dependencies.authEndpoint || {
    fetchLinkedInToken: () => never()
  }
  const authProviders: AuthProviders = {
    linkedIn: {
      signIn: () => {}
    }
  }
  const jwtStorage = new JwtStorage()
  return { router, authEndpoint, authProviders, jwtStorage }
}
