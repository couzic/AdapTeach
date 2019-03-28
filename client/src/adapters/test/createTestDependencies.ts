import { createMemoryHistory } from 'history'
import { never } from 'rxjs'

import { AuthProviders } from '../../core/auth/AuthProviders'
import { JwtStorage } from '../../core/auth/JwtStorage'
import { CoreDependencies } from '../../core/CoreDependencies'
import { createRouter } from '../../core/Router'
import { createTestAssessmentEndpoint } from './createTestAssessmentEndpoint'

export const createTestDependencies = (
  dependencies: Partial<CoreDependencies> = {}
): CoreDependencies => {
  const history = createMemoryHistory()
  const router = createRouter(history)
  const authEndpoint = {
    fetchLinkedInToken: () => never()
  }
  const authProviders: AuthProviders = {
    linkedIn: {
      signIn: () => {}
    }
  }
  const jwtStorage = new JwtStorage()
  const assessmentEndpoint = createTestAssessmentEndpoint()
  return {
    router,
    authEndpoint,
    authProviders,
    jwtStorage,
    assessmentEndpoint,
    ...dependencies
  }
}
