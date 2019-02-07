import { expect } from 'chai'

import { Core, CoreDependencies, createCore } from '../../core/Core'
import { createCoreGateway } from '../../core/CoreGateway'
import { Item } from '../../domain/Item'
import { McqId } from '../../domain/Mcq'
import { User } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { CreateItem } from '../../use-case/contribute/item/CreateItem'
import { AddLearningObjective } from '../../use-case/learn/AddLearningObjective'
import { CheckAnswer } from '../../use-case/learn/CheckAnswer'
import { GetNextAssessment } from '../../use-case/learn/GetNextAssessment'
import { CreateUser } from '../../use-case/user/CreateUser'
import { createMcqFactory, McqFactory } from '../util/McqFactory'

describe('Four items, two assessments (easy one targets 3 items, hard one targets 2, only one is common)', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let user: User
  let easyItem: Item
  let mediumItem: Item
  let commonItem: Item
  let hardItem: Item
  let easyAssessmentId: McqId
  let hardAssessmentId: McqId
  let createTestAssessment: McqFactory
  beforeEach(async () => {
    await cypher.clearDb()
    dependencies = {
      gateway,
      timeProvider: { now: () => 0 },
      repetitionScheduler: { next: () => Promise.resolve(1) }
    } as any
    core = createCore(dependencies)
    createTestAssessment = createMcqFactory(core)
    user = await core.execute(
      CreateUser({
        username: 'username',
        email: 'email'
      } as any)
    )
    commonItem = await core.execute(
      CreateItem({
        name: 'common'
      })
    )
    easyItem = await core.execute(
      CreateItem({
        name: 'easy'
      })
    )
    mediumItem = await core.execute(
      CreateItem({
        name: 'medium'
      })
    )
    hardItem = await core.execute(
      CreateItem({
        name: 'hard'
      })
    )
    await core.execute(AddLearningObjective(user.id, easyItem.id))
    await core.execute(AddLearningObjective(user.id, mediumItem.id))
    await core.execute(AddLearningObjective(user.id, commonItem.id))
    await core.execute(AddLearningObjective(user.id, hardItem.id))
    easyAssessmentId = await createTestAssessment('easy', [
      easyItem.id,
      mediumItem.id,
      commonItem.id
    ])
    hardAssessmentId = await createTestAssessment('hard', [
      commonItem.id,
      hardItem.id
    ])
  })
  describe("when hard assessment passed once and it's time to repeat", () => {
    beforeEach(async () => {
      dependencies.repetitionScheduler.next = () => Promise.resolve(1)
      await core.execute(CheckAnswer(user.id, hardAssessmentId, 0))
      dependencies.timeProvider.now = () => 2
    })
    it('has hard next assessment', async () => {
      const next = await core.execute(GetNextAssessment(user.id))
      expect(next).not.to.be.null
      expect(next!.id).to.equal(hardAssessmentId)
    })
  })
})
