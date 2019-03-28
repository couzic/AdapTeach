import { createBrowserHistory } from 'history'

import { createAuthProviders } from '../../core/auth/AuthProviders'
import { JwtStorage } from '../../core/auth/JwtStorage'
import { CoreDependencies } from '../../core/CoreDependencies'
import { createRouter } from '../../core/Router'
import { createAuthEndpoint } from '../dev/createAuthEndpoint'
import { createHttp } from './createHttp'

export const createProdDependencies = (): CoreDependencies => {
  const history = createBrowserHistory()
  const router = createRouter(history)
  const http = createHttp()
  const authEndpoint = createAuthEndpoint(http)
  const authProviders = createAuthProviders()
  const jwtStorage = new JwtStorage()
  return {
    router,
    authEndpoint,
    authProviders,
    jwtStorage,
    assessmentEndpoint: {} as any
  }
}
