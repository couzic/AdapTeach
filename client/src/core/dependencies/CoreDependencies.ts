import { AuthEndpoint } from '../../auth/AuthEndpoint'
import { AuthProviders } from '../../auth/AuthProviders'
import { JwtStorage } from '../../auth/JwtStorage'
import { Router } from '../Router'
import { AssessmentEndpoint } from './assessment/AssessmentEndpoint'

export interface CoreDependencies {
  router: Router
  jwtStorage: JwtStorage
  authEndpoint: AuthEndpoint
  authProviders: AuthProviders
  assessmentEndpoint: AssessmentEndpoint
}
