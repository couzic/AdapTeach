import { AuthEndpoint } from '../../core/ports/AuthEndpoint'
import { Http } from '../../core/ports/Http'

export const createAuthEndpoint = (http: Http): AuthEndpoint => ({
  fetchLinkedInToken: code => http.post('/auth/linkedin/token', { code })
})
