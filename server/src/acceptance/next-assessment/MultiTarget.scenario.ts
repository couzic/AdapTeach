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

chai.use(sinonChai)
const { expect } = chai

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
    describe('when single-target assessment passes', () => {
      beforeEach(async () => {
        dependencies.repetitionScheduler.next = stub().returns(
          Promise.resolve({ [kc.id]: 1 })
        )
        await core.execute(CheckAnswer(user.id, singleTargetAssessment, 0))
      })
      it('calls scheduler with proper params', () => {
        expect(
          dependencies.repetitionScheduler.next
        ).to.have.been.calledOnceWithExactly({
          passed: true,
          assessmentId: singleTargetAssessment,
          components: [{ id: kc.id, repetition: undefined }],
          assessments: [
            {
              id: multiTargetAssessment,
              assessedComponents: [kc.id],
              history: []
            },
            {
              id: singleTargetAssessment,
              assessedComponents: [kc.id],
              history: []
            }
          ]
        })
      })
    })
    describe(`when single-target assessment passed twice, and it's time to repeat`, () => {
      beforeEach(async () => {
        dependencies.repetitionScheduler.next = () =>
          Promise.resolve({ [kc.id]: 1 })
        await core.execute(CheckAnswer(user.id, singleTargetAssessment, 0))
        dependencies.timeProvider.now = () => 2

        dependencies.repetitionScheduler.next = () =>
          Promise.resolve({ [kc.id]: 3 })
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
          dependencies.repetitionScheduler.next = stub().returns(
            Promise.resolve({ [kc.id]: 5, [anotherKc.id]: 5 })
          )
          await core.execute(CheckAnswer(user.id, multiTargetAssessment, 0))
          dependencies.timeProvider.now = () => 6
        })
        it('calls scheduler with correct params', () => {
          expect(
            dependencies.repetitionScheduler.next
          ).to.have.been.calledOnceWithExactly({
            passed: true,
            assessmentId: multiTargetAssessment,
            components: [
              { id: anotherKc.id, repetition: undefined },
              { id: kc.id, repetition: { time: 3, delay: 1 } }
            ],
            assessments: [
              {
                id: multiTargetAssessment,
                assessedComponents: [anotherKc.id, kc.id],
                history: []
              },
              {
                id: singleTargetAssessment,
                assessedComponents: [kc.id],
                history: [{ passed: true, time: 2 }, { passed: true, time: 0 }]
              }
            ]
          })
        })
        it('has single-target next assessment', async () => {
          const next = await core.execute(GetNextAssessment(user.id))
          expect(next).not.to.be.null
          expect(next!.id).to.equal(singleTargetAssessment)
        })
      })
    })
  })
  describe(`
    (KC-1) <-- (assessment) --> (KC-2)
  `, () => {
    let kc1: KnowledgeComponent
    let kc2: KnowledgeComponent
    let assessmentId: AssessmentId
    beforeEach(async () => {
      kc1 = await createKc('KC-1')
      kc2 = await createKc('KC-2')
      await core.execute(AddToObjective(userObjective.id, kc1.id))
      await core.execute(AddToObjective(userObjective.id, kc2.id))
      assessmentId = await createMcq('mcq', [kc1.id, kc2.id])
    })
    describe('when passed', () => {
      beforeEach(async () => {
        dependencies.repetitionScheduler.next = stub().returns(
          Promise.resolve({ [kc1.id]: 1, [kc2.id]: 1 })
        )
        await core.execute(CheckAnswer(user.id, assessmentId, 0))
      })
      describe(`when it's time to repeat and passed again`, () => {
        beforeEach(async () => {
          dependencies.timeProvider.now = () => 2
          dependencies.repetitionScheduler.next = stub().returns(
            Promise.resolve({ [kc1.id]: 3, [kc2.id]: 3 })
          )
          await core.execute(CheckAnswer(user.id, assessmentId, 0))
        })
        it('calls schedule with proper params', () => {
          expect(
            dependencies.repetitionScheduler.next
          ).to.have.been.calledOnceWithExactly({
            passed: true,
            assessmentId,
            assessments: [
              {
                id: assessmentId,
                assessedComponents: [kc2.id, kc1.id],
                history: [{ passed: true, time: 0 }]
              }
            ],
            components: [
              { id: kc2.id, repetition: { time: 1, delay: 1 } },
              { id: kc1.id, repetition: { time: 1, delay: 1 } }
            ]
          })
        })
        describe(`when it's, AGAIN, time to repeat and passed again`, () => {
          beforeEach(async () => {
            dependencies.timeProvider.now = () => 4
            dependencies.repetitionScheduler.next = stub().returns(
              Promise.resolve({ [kc1.id]: 5, [kc2.id]: 5 })
            )
            await core.execute(CheckAnswer(user.id, assessmentId, 0))
          })
          it('calls schedule with proper params', () => {
            expect(
              dependencies.repetitionScheduler.next
            ).to.have.been.calledOnceWithExactly({
              passed: true,
              assessmentId,
              assessments: [
                {
                  id: assessmentId,
                  assessedComponents: [kc2.id, kc1.id],
                  history: [
                    { passed: true, time: 2 },
                    { passed: true, time: 0 }
                  ]
                }
              ],
              components: [
                { id: kc2.id, repetition: { time: 3, delay: 1 } },
                { id: kc1.id, repetition: { time: 3, delay: 1 } }
              ]
            })
          })
        })
      })
    })
  })
})
