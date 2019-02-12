import { expect } from 'chai'

import { Core, CoreDependencies, createCore } from '../../core/Core'
import { createCoreGateway } from '../../core/CoreGateway'
import { AssessmentId } from '../../domain/Assessment'
import { Composite } from '../../domain/Composite'
import { Item } from '../../domain/Item'
import { User } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { ActivateAssessment } from '../../use-case/contribute/assessment/ActivateAssessment'
import { AddAssessedItem } from '../../use-case/contribute/assessment/AddAssessedItem'
import { CreateAssessment } from '../../use-case/contribute/assessment/CreateAssessment'
import { SetAnswers } from '../../use-case/contribute/assessment/SetAnswers'
import { SetQuestion } from '../../use-case/contribute/assessment/SetQuestion'
import { AddComponent } from '../../use-case/contribute/composite/AddComponent'
import { CreateComposite } from '../../use-case/contribute/composite/CreateComposite'
import { CreateItem } from '../../use-case/contribute/item/CreateItem'
import { AddLearningObjective } from '../../use-case/learn/AddLearningObjective'
import { CheckAnswer } from '../../use-case/learn/CheckAnswer'
import { GetNextAssessment } from '../../use-case/learn/GetNextAssessment'
import { CreateUser } from '../../use-case/user/CreateUser'
import { createMcqFactory, McqFactory } from '../util/McqFactory'

describe('Single Item', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let user: User
  let item: Item
  let composite: Composite
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
    item = await core.execute(
      CreateItem({
        name: 'itemName'
      })
    )
    composite = await core.execute(CreateComposite({ name: 'composite' }))
    await core.execute(AddComponent(composite.id, item.id))
    await core.execute(AddLearningObjective(user.id, composite.id))
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
      await core.execute(AddAssessedItem(assessmentId, item.id))
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
