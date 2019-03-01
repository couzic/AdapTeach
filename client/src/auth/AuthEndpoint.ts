import { Observable } from 'rxjs'

import { Http } from '../core/dependencies/http/Http'
import { User } from '../core/domain/User'
import { JWT } from './JWT'

export interface AuthEndpoint {
  fetchLinkedInToken: (
    code: string
  ) => Observable<{
    jwt: JWT
    user: User
  }>
}

export const createAuthEndpoint = (http: Http): AuthEndpoint => ({
  fetchLinkedInToken: code => http.post('/auth/linkedin/token', { code })
})
