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

describe('Multi-target multi-assessment scenario', () => {
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
     /      \\  <----- (firstAssessment)         
    | firstKc |
     \\      /  <-- (multiTargetAssessment) --> (2 other kcs)
    `, () => {
    let firstKc: KnowledgeComponent
    let secondKc: KnowledgeComponent
    let thirdKc: KnowledgeComponent
    let firstAssessment: AssessmentId
    let multiTargetAssessment: AssessmentId
    beforeEach(async () => {
      firstKc = await createKc('first')
      secondKc = await createKc('second')
      thirdKc = await createKc('third')
      await core.execute(AddToObjective(userObjective.id, firstKc.id))
      await core.execute(AddToObjective(userObjective.id, secondKc.id))
      await core.execute(AddToObjective(userObjective.id, thirdKc.id))
      firstAssessment = await createMcq('first', [firstKc.id])
      multiTargetAssessment = await createMcq('multi-target', [
        firstKc.id,
        secondKc.id,
        thirdKc.id
      ])
    })
    describe(`when first single-target assessment is passed and it's time to repeat`, () => {
      beforeEach(async () => {
        await core.execute(CheckAnswer(user.id, firstAssessment, 0))
        dependencies.timeProvider.now = () => 2
      })
      it('still has first assessment as next', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(firstAssessment)
      })
    })
  })
  describe(`
  /         \\  <-- (firstAssessment)         
 | firstKc |  <-- (secondAssessment)
  \\         /  <-- (thirdAssessment) ---> (secondKc)
    given first assessment passed
      when third assessment is created and it's time to repeat
 `, () => {
    let firstKc: KnowledgeComponent
    let secondKc: KnowledgeComponent
    let firstAssessment: AssessmentId
    let secondAssessment: AssessmentId
    let thirdAssessment: AssessmentId
    beforeEach(async () => {
      firstKc = await createKc('first')
      secondKc = await createKc('second')
      await core.execute(AddToObjective(userObjective.id, firstKc.id))
      await core.execute(AddToObjective(userObjective.id, secondKc.id))
      firstAssessment = await createMcq('first', [firstKc.id])
      secondAssessment = await createMcq('second', [firstKc.id])
      await core.execute(CheckAnswer(user.id, firstAssessment, 0))
      thirdAssessment = await createMcq('third', [firstKc.id, secondKc.id])
      dependencies.timeProvider.now = () => 2
    })
    it('has second assessment as next', async () => {
      const next = await core.execute(GetNextAssessment(user.id))
      expect(next).not.to.be.null
      expect(next!.id).to.equal(secondAssessment)
    })
  })
  describe(`
  /         \\  <-- (firstAssessment)         
 | firstKc |  <-- (secondAssessment) --> (secondKc)
  \\         /  <-- (thirdAssessment) ---> (second & third kcs)
                <-- (fourthAssessment) ---> (second, third & fourth kcs)
 `, () => {
    let firstKc: KnowledgeComponent
    let secondKc: KnowledgeComponent
    let thirdKc: KnowledgeComponent
    let fourthKc: KnowledgeComponent
    let firstAssessment: AssessmentId
    let secondAssessment: AssessmentId
    let thirdAssessment: AssessmentId
    let fourthAssessment: AssessmentId
    beforeEach(async () => {
      firstKc = await createKc('first')
      secondKc = await createKc('second')
      thirdKc = await createKc('third')
      fourthKc = await createKc('fourth')
      await core.execute(AddToObjective(userObjective.id, firstKc.id))
      await core.execute(AddToObjective(userObjective.id, secondKc.id))
      await core.execute(AddToObjective(userObjective.id, thirdKc.id))
      await core.execute(AddToObjective(userObjective.id, fourthKc.id))
      firstAssessment = await createMcq('first', [firstKc.id])
      secondAssessment = await createMcq('second', [firstKc.id, secondKc.id])
      thirdAssessment = await createMcq('third', [
        firstKc.id,
        secondKc.id,
        thirdKc.id
      ])
      fourthAssessment = await createMcq('fourth', [
        firstKc.id,
        secondKc.id,
        thirdKc.id,
        fourthKc.id
      ])
    })
    describe('when first, second and third assessments passed', () => {
      beforeEach(async () => {
        await core.execute(CheckAnswer(user.id, firstAssessment, 0))
        await core.execute(CheckAnswer(user.id, secondAssessment, 0))
        await core.execute(CheckAnswer(user.id, thirdAssessment, 0))
      })
      describe(`when a new single-target assessment is created`, () => {
        let newSingleTargetAssessment: AssessmentId
        beforeEach(async () => {
          newSingleTargetAssessment = await createMcq('new single-target', [
            fourthKc.id
          ])
        })
        it('has new single-target assessment as next', async () => {
          const next = await core.execute(GetNextAssessment(user.id))
          expect(next).not.to.be.null
          expect(next!.id).to.equal(newSingleTargetAssessment)
        })
      })
    })
    describe('when first and second assessments failed, then third assessment passed', () => {
      beforeEach(async () => {
        await core.execute(CheckAnswer(user.id, firstAssessment, 1))
        await core.execute(CheckAnswer(user.id, secondAssessment, 1))
        await core.execute(CheckAnswer(user.id, thirdAssessment, 0))
      })
      describe(`when a new single-target assessment is created`, () => {
        let newSingleTargetAssessment: AssessmentId
        beforeEach(async () => {
          newSingleTargetAssessment = await createMcq('new single-target', [
            fourthKc.id
          ])
        })
        it('has new single-target assessment as next', async () => {
          const next = await core.execute(GetNextAssessment(user.id))
          expect(next).not.to.be.null
          expect(next!.id).to.equal(newSingleTargetAssessment)
        })
      })
    })
  })
})
