import { expect } from 'chai'

import { Core, CoreDependencies, createCore } from '../../core/Core'
import { createCoreGateway } from '../../core/CoreGateway'
import { AssessmentId } from '../../domain/Assessment'
import { KnowledgeComponent } from '../../domain/KnowledgeComponent'
import { LearningObjective } from '../../domain/LearningObjective'
import { User } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { ActivateAssessment } from '../../use-case/contribute/assessment/ActivateAssessment'
import { AddAssessedComponent } from '../../use-case/contribute/assessment/AddAssessedComponent'
import { CreateAssessment } from '../../use-case/contribute/assessment/CreateAssessment'
import { SetAnswers } from '../../use-case/contribute/assessment/SetAnswers'
import { SetQuestion } from '../../use-case/contribute/assessment/SetQuestion'
import { CreateKnowledgeComponent } from '../../use-case/contribute/component/CreateKnowledgeComponent'
import { AddToObjective } from '../../use-case/contribute/objective/AddToObjective'
import { CreateLearningObjective } from '../../use-case/contribute/objective/CreateLearningObjective'
import { AddLearningObjective } from '../../use-case/learn/AddLearningObjective'
import { CheckAnswer } from '../../use-case/learn/CheckAnswer'
import { GetNextAssessment } from '../../use-case/learn/GetNextAssessment'
import { CreateUser } from '../../use-case/user/CreateUser'
import { createMcqFactory, McqFactory } from '../util/McqFactory'

describe('Single Kc', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let user: User
  let kc: KnowledgeComponent
  let userObjective: LearningObjective
  let mcqFactory: McqFactory
  beforeEach(async () => {
    await cypher.clearDb()
    dependencies = {
      gateway,
      timeProvider: { now: () => 0 },
      repetitionScheduler: { next: () => Promise.resolve(1) }
    } as any
    core = createCore(dependencies)
    mcqFactory = createMcqFactory(core)
    user = await core.execute(
      CreateUser({
        username: 'username',
        email: 'email'
      } as any)
    )
    kc = await core.execute(
      CreateKnowledgeComponent({
        name: 'kcName'
      })
    )
    userObjective = await core.execute(
      CreateLearningObjective({ name: 'User objective' })
    )
    await core.execute(AddToObjective(userObjective.id, kc.id))
    await core.execute(AddLearningObjective(user.id, userObjective.id))
  })
  describe('given single inactive assessment', () => {
    let assessmentId: AssessmentId
    beforeEach(async () => {
      const assessment = await core.execute(
        CreateAssessment({
          type: 'MCQ'
        })
      )
      assessmentId = assessment.id
      await core.execute(AddAssessedComponent(assessmentId, kc.id))
      await core.execute(SetQuestion(assessmentId, 'question'))
      await core.execute(
        SetAnswers(assessmentId, [{ text: 'A', correct: true }, { text: 'B' }])
      )
    })
    it('does NOT have next assessment', async () => {
      const next = await core.execute(GetNextAssessment(user.id))
      expect(next).to.be.null
    })
    describe('when assessment is activated', () => {
      beforeEach(async () => {
        await core.execute(ActivateAssessment(assessmentId))
      })
      it('has next assessment', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(assessmentId)
      })
      describe('when assessment passed', () => {
        beforeEach(async () => {
          await core.execute(CheckAnswer(user.id, assessmentId, 0))
        })
        it('does NOT have next assessment', async () => {
          const next = await core.execute(GetNextAssessment(user.id))
          expect(next).to.be.null
        })
        describe("when it's time to repeat", () => {
          beforeEach(() => {
            dependencies.timeProvider.now = () => 2
          })
          it('has next assessment', async () => {
            const next = await core.execute(GetNextAssessment(user.id))
            expect(next).not.to.be.null
            expect(next!.id).to.equal(assessmentId)
          })
        })
      })
      describe('when assessment fails', () => {
        beforeEach(async () => {
          await core.execute(CheckAnswer(user.id, assessmentId, 1))
        })
        it('has next assessment', async () => {
          const next = await core.execute(GetNextAssessment(user.id))
          expect(next).not.to.be.null
          expect(next!.id).to.equal(assessmentId)
        })
      })
    })
  })
})
