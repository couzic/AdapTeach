import 'mocha'

import { expect } from 'chai'

import { Core, CoreDependencies, createCore } from '../../core/Core'
import { createCoreGateway } from '../../core/CoreGateway'
import { AssessmentId } from '../../domain/Assessment'
import { KnowledgeComponent } from '../../domain/KnowledgeComponent'
import { KnowledgeComposite } from '../../domain/KnowledgeComposite'
import { User } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { AddToObjective } from '../../use-case/contribute/objective/AddToObjective'
import { AddLearningObjective } from '../../use-case/learn/AddLearningObjective'
import { CheckAnswer } from '../../use-case/learn/CheckAnswer'
import { FindNextAssessment } from '../../use-case/learn/FindNextAssessment'
import { CreateUser } from '../../use-case/user/CreateUser'
import { createKcFactory, KcFactory } from '../util/KcFactory'
import { createMcqFactory, McqFactory } from '../util/McqFactory'
import {
  createObjectiveFactory,
  ObjectiveFactory
} from '../util/ObjectiveFactory'

describe('Preqs scenario', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let user: User
  let userObjective: KnowledgeComposite
  let createKc: KcFactory
  let createObjective: ObjectiveFactory
  let mcqFactory: McqFactory
  beforeEach(async () => {
    await cypher.clearDb()
    dependencies = {
      gateway,
      timeProvider: { now: () => 0 },
      repetitionScheduler: { next: () => Promise.resolve({}) }
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
    userObjective = await createObjective('User Objective')
    await core.execute(AddLearningObjective(user.id, userObjective.id))
  })
  describe(`
    (easyKc) <--------- (easyAssessment)
               <-[:PREQ]- (hardAssessment) --> (hardKc)
    `, () => {
    let easyKc: KnowledgeComponent
    let hardKc: KnowledgeComponent
    let easyAssessmentId: AssessmentId
    let hardAssessmentId: AssessmentId
    beforeEach(async () => {
      hardKc = await createKc('hard')
      easyKc = await createKc('easy')
      await core.execute(AddToObjective(userObjective.id, easyKc.id))
      await core.execute(AddToObjective(userObjective.id, hardKc.id))
      easyAssessmentId = await mcqFactory('easy', [easyKc.id])
      hardAssessmentId = await mcqFactory('hard', [hardKc.id], {
        prerequisites: [easyKc.id]
      })
    })
    it('has easy next assessment', async () => {
      const next = await core.execute(FindNextAssessment(user.id))
      expect(next).not.to.be.null
      expect(next!.id).to.equal(easyAssessmentId)
    })
  })
  describe(`
  (easyKc) <-- (easyAssessment) -[:PREQ *2]-> (kc)
  (hardKc) <-- (hardAssessment) -[:PREQ *1]-> (composite) -[:COMP]-> () -[:COMP *3]-> (kc)
  `, () => {
    let easyKc: KnowledgeComponent
    let hardKc: KnowledgeComponent
    let easyAssessmentId: AssessmentId
    let hardAssessmentId: AssessmentId
    let easyPreq1: KnowledgeComponent
    let easyPreq2: KnowledgeComponent
    let hardPreq1: KnowledgeComponent
    let hardPreq2: KnowledgeComponent
    let hardPreq3: KnowledgeComponent
    beforeEach(async () => {
      hardKc = await createKc('hard')
      easyKc = await createKc('easy')
      await core.execute(AddToObjective(userObjective.id, easyKc.id))
      await core.execute(AddToObjective(userObjective.id, hardKc.id))
      easyPreq1 = await createKc('easyPreq1')
      easyPreq2 = await createKc('easyPreq2')
      easyAssessmentId = await mcqFactory('easy', [easyKc.id], {
        prerequisites: [easyPreq1.id, easyPreq2.id]
      })
      hardPreq1 = await createKc('hardPreq1')
      hardPreq2 = await createKc('hardPreq2')
      hardPreq3 = await createKc('hardPreq3')
      const hiddenCompositePreq = await createObjective('hiddenCompositePreq', [
        hardPreq1.id,
        hardPreq2.id,
        hardPreq3.id
      ])
      const compositePreq = await createObjective('compositePreq', [
        hiddenCompositePreq.id
      ])
      hardAssessmentId = await mcqFactory('hard', [hardKc.id], {
        prerequisites: [compositePreq.id]
      })
    })
    it('has easy next assessment', async () => {
      const next = await core.execute(FindNextAssessment(user.id))
      expect(next).not.to.be.null
      expect(next!.id).to.equal(easyAssessmentId)
    })
    describe("when both assessments passed and it's time to repeat", () => {
      beforeEach(async () => {
        dependencies.repetitionScheduler.next = () =>
          Promise.resolve({
            [easyKc.id]: 1,
            [hardKc.id]: 1
          })
        await core.execute(CheckAnswer(user.id, easyAssessmentId, 0))
        await core.execute(CheckAnswer(user.id, hardAssessmentId, 0))
        dependencies.timeProvider.now = () => 2
      })
      it('has easy next assessment', async () => {
        const next = await core.execute(FindNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(easyAssessmentId)
      })
    })
    describe('when hard prerequisites are activated', () => {
      beforeEach(async () => {
        dependencies.repetitionScheduler.next = () =>
          Promise.resolve({
            [hardPreq1.id]: 1,
            [hardPreq2.id]: 1,
            [hardPreq3.id]: 1
          })
        const hardPreqAssessmentId = await mcqFactory('hardPreq', [
          hardPreq1.id,
          hardPreq2.id,
          hardPreq3.id
        ])
        await core.execute(CheckAnswer(user.id, hardPreqAssessmentId, 0))
      })
      it('has hard next assessment', async () => {
        const next = await core.execute(FindNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(hardAssessmentId)
      })
      describe("when it's time to repeat", () => {
        beforeEach(() => {
          dependencies.timeProvider.now = () => 2
        })
        it('has easy next assessment', async () => {
          const next = await core.execute(FindNextAssessment(user.id))
          expect(next).not.to.be.null
          expect(next!.id).to.equal(easyAssessmentId)
        })
      })
    })
    describe('when ALL prerequisites are activated once, then only hard prerequisites are active', () => {
      beforeEach(async () => {
        const easyPreqsAssessmentId = await mcqFactory('easyPreqs', [
          easyPreq1.id,
          easyPreq2.id
        ])
        const hardPreqsAssessmentId = await mcqFactory('hardPreqs', [
          hardPreq1.id,
          hardPreq2.id,
          hardPreq3.id
        ])
        dependencies.repetitionScheduler.next = () =>
          Promise.resolve({
            [easyPreq1.id]: 1,
            [easyPreq2.id]: 1,
            [hardPreq1.id]: 1,
            [hardPreq2.id]: 1,
            [hardPreq3.id]: 1
          })
        await core.execute(CheckAnswer(user.id, easyPreqsAssessmentId, 0))
        await core.execute(CheckAnswer(user.id, hardPreqsAssessmentId, 0))
        dependencies.timeProvider.now = () => 2
        dependencies.repetitionScheduler.next = () =>
          Promise.resolve({
            [hardPreq1.id]: 3,
            [hardPreq2.id]: 3,
            [hardPreq3.id]: 3
          })
        await core.execute(CheckAnswer(user.id, hardPreqsAssessmentId, 0))
      })
      it('has hard next assessment', async () => {
        const next = await core.execute(FindNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(hardAssessmentId)
      })
    })
  })
})
