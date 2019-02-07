import { expect } from 'chai'

import { cypher } from '../neo4j/cypher'
import { Core, CoreDependencies, createCore } from '../core/Core'
import { createCoreGateway } from '../core/CoreGateway'
import { AssessmentId } from '../domain/Assessment'
import { Item } from '../domain/Item'
import { User } from '../domain/User'
import { ActivateAssessment } from '../use-case/contribute/assessment/ActivateAssessment'
import { AddAssessedItem } from '../use-case/contribute/assessment/AddAssessedItem'
import { CreateAssessment } from '../use-case/contribute/assessment/CreateAssessment'
import { SetAnswers } from '../use-case/contribute/assessment/SetAnswers'
import { SetQuestion } from '../use-case/contribute/assessment/SetQuestion'
import { CreateItem } from '../use-case/contribute/item/CreateItem'
import { AddLearningObjective } from '../use-case/learn/AddLearningObjective'
import { CheckAnswer } from '../use-case/learn/CheckAnswer'
import { GetNextAssessment } from '../use-case/learn/GetNextAssessment'
import { CreateUser } from '../use-case/user/CreateUser'

describe('Single Item', () => {
  let dependencies: CoreDependencies
  let core: Core
  let user: User
  let item: Item
  beforeEach(async () => {
    await cypher.clearDb()
    dependencies = {
      gateway: createCoreGateway(),
      timeProvider: { now: () => 0 },
      repetitionScheduler: { next: () => Promise.resolve(1) }
    } as any
    core = createCore(dependencies)
    user = await core.execute(
      CreateUser({
        username: 'username',
        email: 'email'
      } as any)
    )
    item = await core.execute(
      CreateItem({
        name: 'itemName'
      })
    )
  })
  describe('given single inactive assessment', () => {
    let assessmentId: AssessmentId
    beforeEach(async () => {
      await core.execute(AddLearningObjective(user.id, item.id))
      const assessment = await core.execute(
        CreateAssessment({
          type: 'MCQ'
        })
      )
      assessmentId = assessment.id
      await core.execute(AddAssessedItem(assessmentId, item.id))
      await core.execute(SetQuestion(assessmentId, 'question'))
      await core.execute(
        SetAnswers(assessmentId, [{ text: 'A', correct: true }, { text: 'B' }])
      )
    })
    it('does NOT have next assessment', async () => {
      const nextAssessment = await core.execute(GetNextAssessment(user.id))
      expect(nextAssessment).to.be.null
    })
    describe('when assessment is activated', () => {
      beforeEach(async () => {
        await core.execute(ActivateAssessment(assessmentId))
      })
      it('has next assessment', async () => {
        const nextAssessment = await core.execute(GetNextAssessment(user.id))
        expect(nextAssessment).not.to.be.null
        expect(nextAssessment!.id).to.deep.equal(assessmentId)
      })
      describe('when user selects correct answer', () => {
        const nextRepetition = 1000
        let answerCheck: boolean
        beforeEach(async () => {
          dependencies.repetitionScheduler.next = () =>
            Promise.resolve(nextRepetition)
          answerCheck = await core.execute(
            CheckAnswer(user.id, assessmentId, 0)
          )
        })
        it('returns true', () => {
          expect(answerCheck).to.be.true
        })
        it('does NOT have next assessment', async () => {
          const nextAssessment = await core.execute(GetNextAssessment(user.id))
          expect(nextAssessment).to.be.null
        })
        describe('when it is time for next repetition', () => {
          beforeEach(() => {
            dependencies.timeProvider.now = () => nextRepetition + 1
          })
          it('has next assessment', async () => {
            const nextAssessment = await core.execute(
              GetNextAssessment(user.id)
            )
            expect(nextAssessment).not.to.be.null
            expect(nextAssessment!.id).to.deep.equal(assessmentId)
          })
        })
      })
      describe('when user selects incorrect answer', () => {
        let answerCheck: boolean
        beforeEach(async () => {
          answerCheck = await core.execute(
            CheckAnswer(user.id, assessmentId, 1)
          )
        })
        it('returns false', () => {
          expect(answerCheck).to.be.false
        })
      })
    })
  })
})
