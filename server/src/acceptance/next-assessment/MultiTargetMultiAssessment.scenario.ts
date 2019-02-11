import { expect } from 'chai'

import { Core, CoreDependencies, createCore } from '../../core/Core'
import { createCoreGateway } from '../../core/CoreGateway'
import { AssessmentId } from '../../domain/Assessment'
import { Composite } from '../../domain/Composite'
import { Item } from '../../domain/Item'
import { User } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { AddComponent } from '../../use-case/contribute/composite/AddComponent'
import { AddLearningObjective } from '../../use-case/learn/AddLearningObjective'
import { CheckAnswer } from '../../use-case/learn/CheckAnswer'
import { GetNextAssessment } from '../../use-case/learn/GetNextAssessment'
import { CreateUser } from '../../use-case/user/CreateUser'
import {
  CompositeFactory,
  createCompositeFactory
} from '../util/CompositeFactory'
import { createItemFactory, ItemFactory } from '../util/ItemFactory'
import { createMcqFactory, McqFactory } from '../util/McqFactory'

describe('Multi-target multi-assessment scenario', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let user: User
  let userObjective: Composite
  let createItem: ItemFactory
  let createComposite: CompositeFactory
  let createMcq: McqFactory
  beforeEach(async () => {
    await cypher.clearDb()
    dependencies = {
      gateway,
      timeProvider: { now: () => 0 },
      repetitionScheduler: { next: () => Promise.resolve(1) }
    } as any
    core = createCore(dependencies)
    createItem = createItemFactory(core)
    createComposite = createCompositeFactory(core)
    createMcq = createMcqFactory(core)
    user = await core.execute(
      CreateUser({
        username: 'username',
        email: 'email'
      } as any)
    )
    userObjective = await createComposite('User Objective')
    await core.execute(AddLearningObjective(user.id, userObjective.id))
  })
  describe(`
     /         \\  <----- (firstAssessment)         
    | firstItem |
     \\         /  <-- (multiTargetAssessment) --> (2 other items)
    `, () => {
    let firstItem: Item
    let secondItem: Item
    let thirdItem: Item
    let firstAssessment: AssessmentId
    let multiTargetAssessment: AssessmentId
    beforeEach(async () => {
      firstItem = await createItem('first')
      secondItem = await createItem('second')
      thirdItem = await createItem('third')
      await core.execute(AddComponent(userObjective.id, firstItem.id))
      await core.execute(AddComponent(userObjective.id, secondItem.id))
      await core.execute(AddComponent(userObjective.id, thirdItem.id))
      firstAssessment = await createMcq('first', [firstItem.id])
      multiTargetAssessment = await createMcq('multi-target', [
        firstItem.id,
        secondItem.id,
        thirdItem.id
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
})
