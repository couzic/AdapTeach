import { expect } from 'chai'

import { Core, CoreDependencies, createCore } from '../../../core/Core'
import { createCoreGateway } from '../../../core/CoreGateway'
import { Item } from '../../../domain/Item'
import { McqId } from '../../../domain/Mcq'
import { User } from '../../../domain/User'
import { cypher } from '../../../neo4j/cypher'
import { ActivateAssessment } from '../../../use-case/contribute/assessment/ActivateAssessment'
import { AddAssessedItem } from '../../../use-case/contribute/assessment/AddAssessedItem'
import { CreateAssessment } from '../../../use-case/contribute/assessment/CreateAssessment'
import { SetAnswers } from '../../../use-case/contribute/assessment/SetAnswers'
import { SetQuestion } from '../../../use-case/contribute/assessment/SetQuestion'
import { CreateItem } from '../../../use-case/contribute/item/CreateItem'
import { AddLearningObjective } from '../../../use-case/learn/AddLearningObjective'
import { CheckAnswer } from '../../../use-case/learn/CheckAnswer'
import { GetNextAssessment } from '../../../use-case/learn/GetNextAssessment'
import { CreateUser } from '../../../use-case/user/CreateUser'

describe('Two items, two assessments (first one targets one item, the other targets both items)', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let user: User
  let easyItem: Item
  let hardItem: Item
  let easyAssessmentId: McqId
  let hardAssessmentId: McqId
  beforeEach(async () => {
    await cypher.clearDb()
    dependencies = {
      gateway,
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
    easyItem = await core.execute(
      CreateItem({
        name: 'easy'
      })
    )
    const easyAssessment = await core.execute(CreateAssessment({ type: 'MCQ' }))
    easyAssessmentId = easyAssessment.id
    await core.execute(AddAssessedItem(easyAssessmentId, easyItem.id))
    await core.execute(SetQuestion(easyAssessmentId, 'Easy question'))
    await core.execute(
      SetAnswers(easyAssessmentId, [
        { text: 'A', correct: true },
        { text: 'B' }
      ])
    )
    await core.execute(ActivateAssessment(easyAssessmentId))
    hardItem = await core.execute(
      CreateItem({
        name: 'hard'
      })
    )
    const hardAssessment = await core.execute(CreateAssessment({ type: 'MCQ' }))
    hardAssessmentId = hardAssessment.id
    await core.execute(AddAssessedItem(hardAssessmentId, easyItem.id))
    await core.execute(AddAssessedItem(hardAssessmentId, hardItem.id))
    await core.execute(SetQuestion(hardAssessmentId, 'Hard question'))
    await core.execute(
      SetAnswers(hardAssessmentId, [
        { text: 'C', correct: true },
        { text: 'D' }
      ])
    )
    await core.execute(ActivateAssessment(hardAssessmentId))
    await core.execute(AddLearningObjective(user.id, easyItem.id))
    await core.execute(AddLearningObjective(user.id, hardItem.id))
  })
  it('has easy next assessment', async () => {
    const next = await core.execute(GetNextAssessment(user.id))
    expect(next).not.to.be.null
    expect(next!.id).to.equal(easyAssessmentId)
  })
  describe("when both assessments passed and it's time for repetition", () => {
    beforeEach(async () => {
      dependencies.repetitionScheduler.next = () => Promise.resolve(1)
      await core.execute(CheckAnswer(user.id, easyAssessmentId, 0))
      await core.execute(CheckAnswer(user.id, hardAssessmentId, 0))
      dependencies.timeProvider.now = () => 2
    })
    it('has easy next assessment', async () => {
      const next = await core.execute(GetNextAssessment(user.id))
      expect(next).not.to.be.null
      expect(next!.id).to.equal(easyAssessmentId)
    })
  })
})
