import { Observable } from 'rxjs'

import { JWT } from '../auth/JWT'
import { User } from '../domain/User'

export interface AuthEndpoint {
  fetchLinkedInToken: (
    code: string
  ) => Observable<{
    jwt: JWT
    user: User
  }>
}
