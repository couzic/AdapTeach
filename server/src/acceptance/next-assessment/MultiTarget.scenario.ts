import { expect } from 'chai'

import { Core, CoreDependencies, createCore } from '../../core/Core'
import { createCoreGateway } from '../../core/CoreGateway'
import { AssessmentId } from '../../domain/Assessment'
import { KnowledgeComponent } from '../../domain/KnowledgeComponent'
import { LearningObjective } from '../../domain/LearningObjective'
import { User } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { AddToObjective } from '../../use-case/contribute/objective/AddToObjective'
import { AddLearningObjective } from '../../use-case/learn/AddLearningObjective'
import { CheckAnswer } from '../../use-case/learn/CheckAnswer'
import { GetNextAssessment } from '../../use-case/learn/GetNextAssessment'
import { CreateUser } from '../../use-case/user/CreateUser'
import { createKcFactory, KcFactory } from '../util/KcFactory'
import { createMcqFactory, McqFactory } from '../util/McqFactory'
import {
  createObjectiveFactory,
  ObjectiveFactory
} from '../util/ObjectiveFactory'

describe('Multi-target scenario', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let user: User
  let userObjective: LearningObjective
  let createKc: KcFactory
  let createObjective: ObjectiveFactory
  let createMcq: McqFactory
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
    createMcq = createMcqFactory(core)
    user = await core.execute(
      CreateUser({
        username: 'username',
        email: 'email'
      } as any)
    )
    userObjective = await createObjective('User Objective')
    await core.execute(AddLearningObjective(user.id, userObjective.id))
  })
  describe(`
     (singleTargetAssessment) --> (kc) <-- (multiTargetAssessment) --> (anotherKc)
    `, () => {
    let kc: KnowledgeComponent
    let anotherKc: KnowledgeComponent
    let singleTargetAssessment: AssessmentId
    let multiTargetAssessment: AssessmentId
    beforeEach(async () => {
      kc = await createKc('kc')
      anotherKc = await createKc('anotherKc')
      await core.execute(AddToObjective(userObjective.id, kc.id))
      await core.execute(AddToObjective(userObjective.id, anotherKc.id))
      singleTargetAssessment = await createMcq('singleTarget', [kc.id])
      multiTargetAssessment = await createMcq('multiTarget', [
        kc.id,
        anotherKc.id
      ])
    })
    it('has single-target next assessment', async () => {
      const next = await core.execute(GetNextAssessment(user.id))
      expect(next).not.to.be.null
      expect(next!.id).to.equal(singleTargetAssessment)
    })
    describe(`when single-target assessment passed twice, and it's time to repeat`, () => {
      beforeEach(async () => {
        await core.execute(CheckAnswer(user.id, singleTargetAssessment, 0))
        dependencies.timeProvider.now = () => 2

        dependencies.repetitionScheduler.next = () => Promise.resolve(3)
        await core.execute(CheckAnswer(user.id, singleTargetAssessment, 0))
        dependencies.timeProvider.now = () => 4
      })
      it('has multi-target next assessment', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(multiTargetAssessment)
      })
      describe(`when multi-target assessment also passed, and it's time to repeat`, () => {
        beforeEach(async () => {
          dependencies.repetitionScheduler.next = () => Promise.resolve(3)
          await core.execute(CheckAnswer(user.id, multiTargetAssessment, 0))
          dependencies.timeProvider.now = () => 4
        })
        it('has single-target next assessment', async () => {
          const next = await core.execute(GetNextAssessment(user.id))
          expect(next).not.to.be.null
          expect(next!.id).to.equal(singleTargetAssessment)
        })
      })
    })
  })
})
