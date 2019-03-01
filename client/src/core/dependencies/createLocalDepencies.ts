import { createBrowserHistory } from 'history'
import { of } from 'rxjs'
import { delay } from 'rxjs/operators'

import { AuthEndpoint } from '../../auth/AuthEndpoint'
import { AuthProviders } from '../../auth/AuthProviders'
import { JWT } from '../../auth/JWT'
import { JwtStorage } from '../../auth/JwtStorage'
import { User } from '../domain/User'
import { createRouter } from '../Router'
import { CoreDependencies } from './CoreDependencies'
import { createHttp } from './http/Http'

const localUser: User = {
  id: 'UserId',
  firstName: 'Mikael',
  lastName: 'Couzic'
}

export const createLocalDependencies = (): CoreDependencies => {
  const history = createBrowserHistory()
  const router = createRouter(history)
  const http = createHttp()
  const authEndpoint: AuthEndpoint = {
    fetchLinkedInToken: () =>
      of({ jwt: 'JWT' as JWT, user: localUser }).pipe(delay(500))
  }
  const authProviders: AuthProviders = {
    linkedIn: {
      signIn: () => router.auth.linkedin.callback.push({ code: 'code' })
    }
  }
  const jwtStorage = new JwtStorage()
  return { router, authEndpoint, authProviders, jwtStorage }
}
