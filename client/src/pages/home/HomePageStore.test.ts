import 'mocha'

import chai from 'chai'
import { Subject } from 'rxjs'
import { stub, SinonStub } from 'sinon'
import sinonChai from 'sinon-chai'

import { Core, createCore } from '../../core/Core'
import { AssessmentEndpoint } from '../../core/ports/AssessmentEndpoint'
import { createTestDependencies } from '../../adapters/test/createTestDependencies'
import { Assessment } from '../../core/domain/Assessment'
import { User } from '../../core/domain/User'
import { HomePageStore } from './HomePageStore'

chai.use(sinonChai)
const { expect } = chai

describe('HomePageStore', () => {
  let assessmentEndpoint: AssessmentEndpoint
  let core: Core
  let store: HomePageStore
  let fetchedNextAssessment$: Subject<Assessment | null>
  const resetHistory = () => {
    ;(assessmentEndpoint.fetchNextAssessment as SinonStub).resetHistory()
  }
  beforeEach(() => {
    fetchedNextAssessment$ = new Subject()
    assessmentEndpoint = {
      fetchNextAssessment: stub().returns(fetchedNextAssessment$)
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
      const nextAssessment: Assessment = {} as any
      beforeEach(() => {
        resetHistory()
        core.router.home.push()
        fetchedNextAssessment$.next(nextAssessment)
      })
      it('fetches next assessment', () => {
        expect(
          assessmentEndpoint.fetchNextAssessment
        ).to.have.been.calledOnceWithExactly(user.id)
      })
      it('stores next assessment', () => {
        expect(store.currentState.nextAssessment).to.equal(nextAssessment)
      })
    })
  })
})
