import 'mocha'

import { expect } from 'chai'

import { Core, CoreDependencies, createCore } from '../../core/Core'
import { createCoreGateway } from '../../core/CoreGateway'
import { AssessmentId } from '../../domain/Assessment'
import { KnowledgeComponent } from '../../domain/KnowledgeComponent'
import { LearningObjective } from '../../domain/LearningObjective'
import { User } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { AddPrerequisite } from '../../use-case/contribute/assessment/AddPrerequisite'
import { AddToObjective } from '../../use-case/contribute/objective/AddToObjective'
import { CreateLearningObjective } from '../../use-case/contribute/objective/CreateLearningObjective'
import { AddLearningObjective } from '../../use-case/learn/AddLearningObjective'
import { FindNextAssessment } from '../../use-case/learn/FindNextAssessment'
import { CreateUser } from '../../use-case/user/CreateUser'
import { createKcFactory, KcFactory } from '../util/KcFactory'
import { createMcqFactory, McqFactory } from '../util/McqFactory'
import {
  createObjectiveFactory,
  ObjectiveFactory
} from '../util/ObjectiveFactory'

describe('Out of scope and Preqs scenario', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let user: User
  let userObjective: LearningObjective
  let createKc: KcFactory
  let createObjective: ObjectiveFactory
  let mcqFactory: McqFactory
  beforeEach(async () => {
    await cypher.clearDb()
    dependencies = {
      gateway,
      timeProvider: { now: () => 0 },
      repetitionScheduler: { next: () => Promise.resolve(1) }
    } as any
    core = createCore(dependencies)
    createKc = createKcFactory(core)
    createObjective = createObjectiveFactory(core)
    mcqFactory = createMcqFactory(core)
    user = await core.execute(
      CreateUser({
        linkedInId: 'LinkedInUserId',
        firstName: 'firstName',
        lastName: 'lastName'
      })
    )
    userObjective = await core.execute(
      CreateLearningObjective({ name: 'User objective' })
    )
    await core.execute(AddLearningObjective(user.id, userObjective.id))
  })
  describe(`
     (preq) <-[:HAS_PREQ]- (inScopeAssessment) --> (inScopeKc) <-- (partiallyInScopeAssessment) --> (outOfScopeKc)
    `, () => {
    let preq: KnowledgeComponent
    let inScopeKc: KnowledgeComponent
    let outOfScopeKc: KnowledgeComponent
    let inScopeAssessment: AssessmentId
    let partiallyInScopeAssessment: AssessmentId
    beforeEach(async () => {
      preq = await createKc('preq')
      inScopeKc = await createKc('inScope')
      outOfScopeKc = await createKc('outOfScope')
      await core.execute(AddToObjective(userObjective.id, inScopeKc.id))
      inScopeAssessment = await mcqFactory('inScope', [inScopeKc.id])
      partiallyInScopeAssessment = await mcqFactory('partiallyInScope', [
        inScopeKc.id,
        outOfScopeKc.id
      ])
      await core.execute(AddPrerequisite(inScopeAssessment, preq.id))
    })
    it('has "in scope" next assessment', async () => {
      const next = await core.execute(FindNextAssessment(user.id))
      expect(next).not.to.be.null
      expect(next!.id).to.equal(inScopeAssessment)
    })
  })
})
