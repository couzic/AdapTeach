import { createBrowserHistory } from 'history'

import { createAuthEndpoint } from '../../auth/AuthEndpoint'
import { createAuthProviders } from '../../auth/AuthProviders'
import { JwtStorage } from '../../auth/JwtStorage'
import { createRouter } from '../Router'
import { CoreDependencies } from './CoreDependencies'
import { createHttp } from './http/Http'

export const createProductionDependencies = (): CoreDependencies => {
  const history = createBrowserHistory()
  const router = createRouter(history)
  const http = createHttp()
  const authEndpoint = createAuthEndpoint(http)
  const authProviders = createAuthProviders()
  const jwtStorage = new JwtStorage()
  return { router, authEndpoint, authProviders, jwtStorage }
}
