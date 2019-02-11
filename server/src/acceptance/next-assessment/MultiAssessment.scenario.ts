import { expect } from 'chai'

import { Core, CoreDependencies, createCore } from '../../core/Core'
import { createCoreGateway } from '../../core/CoreGateway'
import { AssessmentId } from '../../domain/Assessment'
import { Composite } from '../../domain/Composite'
import { Item } from '../../domain/Item'
import { User } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { AddComponent } from '../../use-case/contribute/composite/AddComponent'
import { CreateComposite } from '../../use-case/contribute/composite/CreateComposite'
import { CreateItem } from '../../use-case/contribute/item/CreateItem'
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

describe('Multi-assessment scenario', () => {
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
    userObjective = await core.execute(
      CreateComposite({ name: 'userObjective' })
    )
    await core.execute(AddLearningObjective(user.id, userObjective.id))
  })
  describe('given item with two assessments', () => {
    let item: Item
    let firstAssessment: AssessmentId
    let secondAssessment: AssessmentId
    beforeEach(async () => {
      item = await core.execute(CreateItem({ name: 'item' }))
      await core.execute(AddComponent(userObjective.id, item.id))
      firstAssessment = await createMcq('first', [item.id])
      secondAssessment = await createMcq('second', [item.id])
    })
    describe("when second assessment passed and it's time to repeat", () => {
      beforeEach(async () => {
        await core.execute(CheckAnswer(user.id, secondAssessment, 0))
        dependencies.timeProvider.now = () => 2
      })
      it('has first assessment as next', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(firstAssessment)
      })
      describe("when first assessment fails and it's time to repeat", () => {
        beforeEach(async () => {
          dependencies.repetitionScheduler.next = () => Promise.resolve(3)
          await core.execute(CheckAnswer(user.id, firstAssessment, 1))
          dependencies.timeProvider.now = () => 4
        })
        it('has second assessment as next', async () => {
          const next = await core.execute(GetNextAssessment(user.id))
          expect(next).not.to.be.null
          expect(next!.id).to.equal(secondAssessment)
        })
      })
    })
    describe("when second, then first, then second assessment passed and it's time to repeat", () => {
      beforeEach(async () => {
        await core.execute(CheckAnswer(user.id, secondAssessment, 0))
        dependencies.timeProvider.now = () => 2
        dependencies.repetitionScheduler.next = () => Promise.resolve(3)
        await core.execute(CheckAnswer(user.id, firstAssessment, 0))
        dependencies.timeProvider.now = () => 4
        dependencies.repetitionScheduler.next = () => Promise.resolve(5)
        await core.execute(CheckAnswer(user.id, secondAssessment, 0))
        dependencies.timeProvider.now = () => 6
      })
      it('has first assessment as next', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(firstAssessment)
      })
    })
    describe("when second assessment passes twice, then first assessment fails, and it's time to repeat", () => {
      beforeEach(async () => {
        await core.execute(CheckAnswer(user.id, secondAssessment, 0))
        dependencies.timeProvider.now = () => 2
        dependencies.repetitionScheduler.next = () => Promise.resolve(3)
        await core.execute(CheckAnswer(user.id, secondAssessment, 0))
        dependencies.timeProvider.now = () => 4
        dependencies.repetitionScheduler.next = () => Promise.resolve(5)
        await core.execute(CheckAnswer(user.id, firstAssessment, 1))
      })
      it('still has first assessment as next', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(firstAssessment)
      })
    })
  })

  describe(`
     (assessment) --> (item) <-- (distantAssessment) --> (distantItem)
    `, () => {
    let item: Item
    let assessment: AssessmentId
    let distantItem: Item
    let distantAssessment: AssessmentId
    beforeEach(async () => {
      item = await createItem('item')
      assessment = await createMcq('inScope', [item.id])
      await core.execute(AddComponent(userObjective.id, item.id))

      distantItem = await createItem('distantItem')
      distantAssessment = await createMcq('inDeepScope', [
        item.id,
        distantItem.id
      ])
      const hiddenComposite = await createComposite('hidden', [distantItem.id])
      await core.execute(AddComponent(userObjective.id, hiddenComposite.id))
    })
    describe(`when assessment passed twice, and it's time to repeat`, () => {
      beforeEach(async () => {
        await core.execute(CheckAnswer(user.id, assessment, 0))
        dependencies.timeProvider.now = () => 2

        dependencies
        await core.execute(CheckAnswer(user.id, assessment, 0))
        dependencies.timeProvider.now = () => 2
      })
      it('has distant next assessment', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(distantAssessment)
      })
    })
  })

  describe('given an item with an assessment', () => {
    let item: Item
    let assessment: AssessmentId
    beforeEach(async () => {
      item = await createItem('item')
      await core.execute(AddComponent(userObjective.id, item.id))
      assessment = await createMcq('assessment', [item.id])
    })
    describe(`when an assessment is created and passed twice`, () => {
      beforeEach(async () => {
        await core.execute(CheckAnswer(user.id, assessment, 0))
        dependencies.timeProvider.now = () => 2

        dependencies.repetitionScheduler.next = () => Promise.resolve(3)
        await core.execute(CheckAnswer(user.id, assessment, 0))
        dependencies.timeProvider.now = () => 4
      })
      describe(`when another assessment is created, then passed, and it's time to repeat`, () => {
        let anotherAssessment: AssessmentId
        beforeEach(async () => {
          anotherAssessment = await createMcq('another', [item.id])

          dependencies.repetitionScheduler.next = () => Promise.resolve(7)
          await core.execute(CheckAnswer(user.id, anotherAssessment, 0))
          dependencies.timeProvider.now = () => 8
        })
        it('has first as next assessment ', async () => {
          const next = await core.execute(GetNextAssessment(user.id))
          expect(next).not.to.be.null
          expect(next!.id).to.equal(assessment)
        })
      })
    })
  })
})
