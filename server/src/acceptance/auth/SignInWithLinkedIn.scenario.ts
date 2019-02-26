import 'mocha'

import chai from 'chai'
import { stub } from 'sinon'
import sinonChai from 'sinon-chai'

import { Core, CoreDependencies, createCore } from '../../core/Core'
import { createCoreGateway } from '../../core/CoreGateway'
import {
  LinkedInGateway,
  LinkedInUserProfile
} from '../../core/ports/LinkedInGateway'
import { User } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { SignInWithLinkedIn } from '../../use-case/user/auth/SignInWithLinkedIn'

chai.use(sinonChai)
const { expect } = chai

describe('Sign in with LinkedIn scenario', () => {
  const gateway = createCoreGateway()
  let linkedIn: LinkedInGateway
  let dependencies: CoreDependencies
  let core: Core
  beforeEach(async () => {
    await cypher.clearDb()
    linkedIn = {} as any
    dependencies = {
      gateway,
      linkedIn
    } as any
    core = createCore(dependencies)
  })
  describe('when new user signs in successfully', () => {
    const linkedInUserProfile: LinkedInUserProfile = {
      id: 'LinkedInUserId',
      firstName: 'Mikael',
      lastName: 'Couzic'
    }
    const { id: linkedInId, firstName, lastName } = linkedInUserProfile
    let createdUser: User
    beforeEach(async () => {
      linkedIn.getAccessToken = stub().returns({ token: 'token' })
      linkedIn.getUserProfile = stub().returns(linkedInUserProfile)
      createdUser = await core.execute(SignInWithLinkedIn(''))
    })
    it('returns created user', () => {
      expect(createdUser.linkedInId).to.equal(linkedInId)
      expect(createdUser.firstName).to.equal(firstName)
      expect(createdUser.lastName).to.equal(lastName)
    })
    describe('when same user signs in again', () => {
      let foundUser: User
      beforeEach(async () => {
        foundUser = await core.execute(SignInWithLinkedIn(''))
      })
      it('returns found user', () => {
        expect(foundUser).to.deep.equal(createdUser)
      })
    })
  })
})
