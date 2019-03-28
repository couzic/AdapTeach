import { AuthProviders } from './auth/AuthProviders'
import { JwtStorage } from './auth/JwtStorage'
import { AssessmentEndpoint } from './ports/AssessmentEndpoint'
import { AuthEndpoint } from './ports/AuthEndpoint'
import { Router } from './Router'

export interface CoreDependencies {
  router: Router
  jwtStorage: JwtStorage
  authEndpoint: AuthEndpoint
  authProviders: AuthProviders
  assessmentEndpoint: AssessmentEndpoint
}
