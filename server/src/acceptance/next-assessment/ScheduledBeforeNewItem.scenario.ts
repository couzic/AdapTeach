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

describe('Three items, two assessments, no overlapping', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let createMcq: McqFactory
  let user: User
  let easyItem: Item
  let mediumItem: Item
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
    createMcq = createMcqFactory(core)
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
    await core.execute(AddLearningObjective(user.id, hardItem.id))
    easyAssessmentId = await createMcq('easy', [easyItem.id, mediumItem.id])
    hardAssessmentId = await createMcq('hard', [hardItem.id])
  })
  describe("when easy assessment passed and it's time for repetition", () => {
    beforeEach(async () => {
      dependencies.repetitionScheduler.next = () => Promise.resolve(1)
      await core.execute(CheckAnswer(user.id, easyAssessmentId, 0))
      dependencies.timeProvider.now = () => 2
    })
    it('has easy next assessment', async () => {
      const next = await core.execute(GetNextAssessment(user.id))
      expect(next).not.to.be.null
      expect(next!.id).to.equal(easyAssessmentId)
    })
  })
})
