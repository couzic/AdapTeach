import chai from 'chai'
import { stub } from 'sinon'
import sinonChai from 'sinon-chai'

import { Core, CoreDependencies, createCore } from '../../core/Core'
import { createCoreGateway } from '../../core/CoreGateway'
import { AssessmentId } from '../../domain/Assessment'
import { KnowledgeComponent } from '../../domain/KnowledgeComponent'
import { LearningObjective } from '../../domain/LearningObjective'
import { User } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { CreateKnowledgeComponent } from '../../use-case/contribute/component/CreateKnowledgeComponent'
import { AddToObjective } from '../../use-case/contribute/objective/AddToObjective'
import { CreateLearningObjective } from '../../use-case/contribute/objective/CreateLearningObjective'
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

chai.use(sinonChai)
const { expect } = chai

describe('Multi-assessment scenario', () => {
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
      repetitionScheduler: { next: stub().returns(Promise.resolve({})) }
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
    userObjective = await core.execute(
      CreateLearningObjective({ name: 'userObjective' })
    )
    await core.execute(AddLearningObjective(user.id, userObjective.id))
  })
  describe('given kc with two assessments', () => {
    let kc: KnowledgeComponent
    let firstAssessment: AssessmentId
    let secondAssessment: AssessmentId
    beforeEach(async () => {
      kc = await core.execute(CreateKnowledgeComponent({ name: 'kc' }))
      await core.execute(AddToObjective(userObjective.id, kc.id))
      firstAssessment = await createMcq('first', [kc.id])
      secondAssessment = await createMcq('second', [kc.id])
    })
    describe("when second assessment passed and it's time to repeat", () => {
      beforeEach(async () => {
        dependencies.repetitionScheduler.next = stub().returns(
          Promise.resolve({ [kc.id]: 1 })
        )
        await core.execute(CheckAnswer(user.id, secondAssessment, 0))
        dependencies.timeProvider.now = () => 2
      })
      it('called scheduler with proper params', () => {
        expect(
          dependencies.repetitionScheduler.next
        ).to.have.been.calledOnceWithExactly({
          passed: true,
          assessmentId: secondAssessment,
          components: [{ id: kc.id, repetition: undefined }],
          assessments: [
            { id: secondAssessment, assessedComponents: [kc.id], history: [] },
            { id: firstAssessment, assessedComponents: [kc.id], history: [] }
          ]
        })
      })
      it('has first assessment as next', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(firstAssessment)
      })
      describe("when first assessment fails and it's time to repeat", () => {
        beforeEach(async () => {
          dependencies.repetitionScheduler.next = () =>
            Promise.resolve({ [kc.id]: 3 })
          await core.execute(CheckAnswer(user.id, firstAssessment, 1))
          dependencies.timeProvider.now = () => 4
        })
        it('has second assessment as next', async () => {
          const next = await core.execute(GetNextAssessment(user.id))
          expect(next).not.to.be.null
          expect(next!.id).to.equal(secondAssessment)
        })
      })
    })
    describe("when second, then first, then second assessment passed and it's time to repeat", () => {
      beforeEach(async () => {
        dependencies.repetitionScheduler.next = () =>
          Promise.resolve({ [kc.id]: 1 })
        await core.execute(CheckAnswer(user.id, secondAssessment, 0))
        dependencies.timeProvider.now = () => 2
        dependencies.repetitionScheduler.next = () =>
          Promise.resolve({ [kc.id]: 3 })
        await core.execute(CheckAnswer(user.id, firstAssessment, 0))
        dependencies.timeProvider.now = () => 4
        dependencies.repetitionScheduler.next = () =>
          Promise.resolve({ [kc.id]: 5 })
        await core.execute(CheckAnswer(user.id, secondAssessment, 0))
        dependencies.timeProvider.now = () => 6
      })
      it('has first assessment as next', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(firstAssessment)
      })
    })
  })

  describe(`
     (assessment) --> (kc) <-- (distantAssessment) --> (distantKc)
    `, () => {
    let kc: KnowledgeComponent
    let assessment: AssessmentId
    let distantKc: KnowledgeComponent
    let distantAssessment: AssessmentId
    beforeEach(async () => {
      kc = await createKc('kc')
      assessment = await createMcq('inScope', [kc.id])
      await core.execute(AddToObjective(userObjective.id, kc.id))

      distantKc = await createKc('distantKc')
      distantAssessment = await createMcq('inDeepScope', [kc.id, distantKc.id])
      const hiddenObjective = await createObjective('hidden', [distantKc.id])
      await core.execute(AddToObjective(userObjective.id, hiddenObjective.id))
    })
    describe(`when assessment passed twice, and it's time to repeat`, () => {
      beforeEach(async () => {
        dependencies.repetitionScheduler.next = () =>
          Promise.resolve({ [kc.id]: 2 })
        await core.execute(CheckAnswer(user.id, assessment, 0))
        dependencies.timeProvider.now = () => 2

        await core.execute(CheckAnswer(user.id, assessment, 0))
        dependencies.timeProvider.now = () => 2
      })
      it('has distant next assessment', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(distantAssessment)
      })
    })
  })

  describe('given a kc with an assessment', () => {
    let kc: KnowledgeComponent
    let assessment: AssessmentId
    beforeEach(async () => {
      kc = await createKc('kc')
      await core.execute(AddToObjective(userObjective.id, kc.id))
      assessment = await createMcq('assessment', [kc.id])
    })
    describe(`when an assessment is created and passed twice`, () => {
      beforeEach(async () => {
        dependencies.repetitionScheduler.next = () =>
          Promise.resolve({ [kc.id]: 1 })
        await core.execute(CheckAnswer(user.id, assessment, 0))
        dependencies.timeProvider.now = () => 2

        dependencies.repetitionScheduler.next = () =>
          Promise.resolve({ [kc.id]: 3 })
        await core.execute(CheckAnswer(user.id, assessment, 0))
        dependencies.timeProvider.now = () => 4
      })
      describe(`when another assessment is created, then passed, and it's time to repeat`, () => {
        let anotherAssessment: AssessmentId
        beforeEach(async () => {
          anotherAssessment = await createMcq('another', [kc.id])

          dependencies.repetitionScheduler.next = () =>
            Promise.resolve({ [kc.id]: 7 })
          await core.execute(CheckAnswer(user.id, anotherAssessment, 0))
          dependencies.timeProvider.now = () => 8
        })
        it('has first as next assessment ', async () => {
          const next = await core.execute(GetNextAssessment(user.id))
          expect(next).not.to.be.null
          expect(next!.id).to.equal(assessment)
        })
      })
    })
  })
})
