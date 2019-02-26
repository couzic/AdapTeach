import 'mocha'

import chai from 'chai'
import { stub } from 'sinon'
import sinonChai from 'sinon-chai'

import { Core, CoreDependencies, createCore } from '../../../core/Core'
import { CoreGateway } from '../../../core/CoreGateway'
import { IdFactory } from '../../../core/ports/IdFactory'
import {
  LinkedInGateway,
  LinkedInUserProfile
} from '../../../core/ports/LinkedInGateway'
import { User, UserId } from '../../../domain/User'
import { SignInWithLinkedIn } from './SignInWithLinkedIn'

chai.use(sinonChai)
const { expect } = chai

describe('Sign in with LinkedIn scenario', () => {
  let gateway: CoreGateway
  let linkedIn: LinkedInGateway
  let idFactory: IdFactory
  let dependencies: CoreDependencies
  let core: Core
  beforeEach(async () => {
    gateway = {} as any
    linkedIn = {} as any
    idFactory = {} as any
    dependencies = {
      gateway,
      linkedIn,
      idFactory
    } as any
    core = createCore(dependencies)
  })
  describe('when new user signs in successfully', () => {
    const authorizationCode = 'authCode'
    const token = 'token'
    const userId: UserId = 'UserId'
    const linkedInUserProfile: LinkedInUserProfile = {
      id: 'LinkedInUserId',
      firstName: 'Mikael',
      lastName: 'Couzic'
    }
    const user: User = {
      id: userId,
      linkedInId: linkedInUserProfile.id,
      firstName: linkedInUserProfile.firstName,
      lastName: linkedInUserProfile.lastName
    }
    let createdUser: User
    beforeEach(async () => {
      linkedIn.getAccessToken = stub().returns({ token })
      linkedIn.getUserProfile = stub().returns(linkedInUserProfile)
      idFactory.createId = () => userId
      gateway.createUser = stub().returns(user)
      createdUser = await core.execute(SignInWithLinkedIn(authorizationCode))
    })
    it('fetches LinkedIn token with correct auth code', () => {
      expect(linkedIn.getAccessToken).to.have.been.calledOnceWithExactly(
        authorizationCode
      )
    })
    it('fetches LinkedIn user profile with correct token', () => {
      expect(linkedIn.getUserProfile).to.have.been.calledOnceWithExactly(token)
    })
    it('creates user in DB', () => {
      expect(gateway.createUser).to.have.been.calledOnceWithExactly(user)
    })
    it('returns created user', () => {
      expect(createdUser).to.deep.equal(user)
    })
  })
})
