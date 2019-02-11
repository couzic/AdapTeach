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

describe('Multi-target scenario', () => {
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
     (singleTargetAssessment) --> (item) <-- (multiTargetAssessment) --> (anotherItem)
    `, () => {
    let item: Item
    let anotherItem: Item
    let singleTargetAssessment: AssessmentId
    let multiTargetAssessment: AssessmentId
    beforeEach(async () => {
      item = await createItem('item')
      anotherItem = await createItem('anotherItem')
      await core.execute(AddComponent(userObjective.id, item.id))
      await core.execute(AddComponent(userObjective.id, anotherItem.id))
      singleTargetAssessment = await createMcq('singleTarget', [item.id])
      multiTargetAssessment = await createMcq('multiTarget', [
        item.id,
        anotherItem.id
      ])
    })
    it('has single-target next assessment', async () => {
      const next = await core.execute(GetNextAssessment(user.id))
      expect(next).not.to.be.null
      expect(next!.id).to.equal(singleTargetAssessment)
    })
    describe(`when single-target assessment passed, and it's time to repeat`, () => {
      beforeEach(async () => {
        await core.execute(CheckAnswer(user.id, singleTargetAssessment, 0))
        dependencies.timeProvider.now = () => 2
      })
      it('has multi-target next assessment', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(multiTargetAssessment)
      })
      describe(`when multi-target assessment also passed, and it's time to repeat`, () => {
        beforeEach(async () => {
          dependencies.repetitionScheduler.next = () => Promise.resolve(3)
          await core.execute(CheckAnswer(user.id, multiTargetAssessment, 0))
          dependencies.timeProvider.now = () => 4
        })
        it('has single-target next assessment', async () => {
          const next = await core.execute(GetNextAssessment(user.id))
          expect(next).not.to.be.null
          expect(next!.id).to.equal(singleTargetAssessment)
        })
      })
    })
  })
})
