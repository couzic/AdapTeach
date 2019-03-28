import 'mocha'

import chai from 'chai'
import { never } from 'rxjs'
import { stub } from 'sinon'
import sinonChai from 'sinon-chai'

import { Core, createCore } from '../../core/Core'
import { AssessmentEndpoint } from '../../core/dependencies/assessment/AssessmentEndpoint'
import { createTestDependencies } from '../../core/dependencies/createTestDependencies'
import { User } from '../../core/domain/User'
import { HomePageStore } from './HomePageStore'

chai.use(sinonChai)
const { expect } = chai

describe('HomePageStore', () => {
  let assessmentEndpoint: AssessmentEndpoint
  let core: Core
  let store: HomePageStore
  beforeEach(() => {
    assessmentEndpoint = {
      fetchNextAssessment: stub().returns(never())
    }
    const dependencies = createTestDependencies({ assessmentEndpoint })
    core = createCore(dependencies)
    store = core.home.store
  })
  describe('given user successfully signed in', () => {
    const user: User = {
      id: 'UserId',
      firstName: 'First Name',
      lastName: 'Last Name'
    }
    beforeEach(() => {
      core.auth.store.dispatch({ userSignedIn: user })
    })
    describe('when entered', () => {
      beforeEach(() => {
        core.router.home.push()
      })
      it('fetches next assessment', () => {
        expect(
          assessmentEndpoint.fetchNextAssessment
        ).to.have.been.calledOnceWithExactly(user.id)
      })
    })
  })
})
