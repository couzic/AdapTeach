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
import { User } from '../../../domain/User'
import { SignInWithLinkedIn } from './SignInWithLinkedIn'

chai.use(sinonChai)
const { expect } = chai

describe('SignInWithLinkedIn', () => {
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
    const linkedInUserProfile: LinkedInUserProfile = {
      id: 'LinkedInUserId',
      firstName: 'Mikael',
      lastName: 'Couzic'
    }
    const user: User = {
      id: 'UserId',
      linkedInId: linkedInUserProfile.id,
      firstName: linkedInUserProfile.firstName,
      lastName: linkedInUserProfile.lastName
    }
    let createdUser: User
    beforeEach(async () => {
      linkedIn.getAccessToken = stub().returns({ token })
      linkedIn.getUserProfile = stub().returns(linkedInUserProfile)
      gateway.findLinkedInUser = () => Promise.resolve(null)
      idFactory.createId = () => user.id
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
  describe('when existing user signs in successfully', () => {
    const linkedInUserProfile: LinkedInUserProfile = {
      id: 'LinkedInUserId',
      firstName: 'Mikael',
      lastName: 'Couzic'
    }
    const { id: linkedInId, firstName, lastName } = linkedInUserProfile
    const user: User = {
      id: 'UserId',
      linkedInId,
      firstName,
      lastName
    }
    let foundUser: User
    beforeEach(async () => {
      linkedIn.getAccessToken = stub().returns({ token: 'token' })
      linkedIn.getUserProfile = stub().returns(linkedInUserProfile)
      gateway.findLinkedInUser = stub().returns(user)
      foundUser = await core.execute(SignInWithLinkedIn(''))
    })
    it('calls gateway with LinkedIn user ID', () => {
      expect(gateway.findLinkedInUser).to.have.been.calledOnceWithExactly(
        linkedInUserProfile.id
      )
    })
    it('returns user profile', () => {
      expect(foundUser).to.deep.equal(user)
    })
  })
})
