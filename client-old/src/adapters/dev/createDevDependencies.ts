import { createBrowserHistory } from 'history'
import { of } from 'rxjs'
import { delay } from 'rxjs/operators'

import { AuthProviders } from '../../core/auth/AuthProviders'
import { JWT } from '../../core/auth/JWT'
import { JwtStorage } from '../../core/auth/JwtStorage'
import { CoreDependencies } from '../../core/CoreDependencies'
import { User } from '../../core/domain/User'
import { AuthEndpoint } from '../../core/ports/AuthEndpoint'
import { createRouter } from '../../core/Router'
import { createDevAssessmentEndpoint } from './createDevAssessmentEndpoint'

const localUser: User = {
  id: 'UserId',
  firstName: 'Mikael',
  lastName: 'Couzic'
}

export const createDevDependencies = (): CoreDependencies => {
  const history = createBrowserHistory()
  const router = createRouter(history)
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
  const assessmentEndpoint = createDevAssessmentEndpoint()
  return {
    router,
    authEndpoint,
    authProviders,
    jwtStorage,
    assessmentEndpoint
  }
}
