import 'mocha'

import chai from 'chai'
import { of } from 'rxjs'
import { stub } from 'sinon'
import sinonChai from 'sinon-chai'

import { createCore } from '../core/Core'
import { createTestDependencies } from '../core/dependencies/createTestDependencies'
import { Router } from '../core/Router'
import { AuthEndpoint } from './AuthEndpoint'
import { AuthStore } from './AuthStore'
import { JwtStorage } from './JwtStorage'

chai.use(sinonChai)
const { expect } = chai

describe('AuthStore', () => {
  let store: AuthStore
  describe('when app loaded at LinkedIn callback route', () => {
    let router: Router
    let authEndpoint: AuthEndpoint
    let jwtStorage: JwtStorage
    const code = 'code'
    const jwt = 'jwt'
    const user = { id: 'userId' }
    beforeEach(() => {
      authEndpoint = {
        fetchLinkedInToken: stub().returns(of({ jwt, user }))
      }
      const dependencies = createTestDependencies({ authEndpoint })
      router = dependencies.router
      jwtStorage = dependencies.jwtStorage
      const core = createCore(dependencies)
      store = core.auth.store
      core.router.auth.linkedin.callback.push({ code: 'code' })
    })
    it('fetches LinkedIn token', () => {
      expect(
        authEndpoint.fetchLinkedInToken
      ).to.have.been.calledOnceWithExactly(code)
    })
    it('stores JWT in dedicated storage', () => {
      expect(jwtStorage.jwt).to.equal(jwt)
    })
    it('stores signed in user', () => {
      expect(store.currentState).to.deep.equal({
        signedInUser: user
      })
    })
    it('navigates back to home page', () => {
      expect(router.home.isMatchingExact).to.be.true
    })
  })
})
