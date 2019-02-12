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
  describe(`
  /         \\  <-- (firstAssessment)         
 | firstItem |  <-- (secondAssessment)
  \\         /  <-- (thirdAssessment) ---> (secondItem)
    given first assessment passed
      when third assessment is created and it's time to repeat
 `, () => {
    let firstItem: Item
    let secondItem: Item
    let firstAssessment: AssessmentId
    let secondAssessment: AssessmentId
    let thirdAssessment: AssessmentId
    beforeEach(async () => {
      firstItem = await createItem('first')
      secondItem = await createItem('second')
      await core.execute(AddComponent(userObjective.id, firstItem.id))
      await core.execute(AddComponent(userObjective.id, secondItem.id))
      firstAssessment = await createMcq('first', [firstItem.id])
      secondAssessment = await createMcq('second', [firstItem.id])
      await core.execute(CheckAnswer(user.id, firstAssessment, 0))
      thirdAssessment = await createMcq('third', [firstItem.id, secondItem.id])
      dependencies.timeProvider.now = () => 2
    })
    it('has second assessment as next', async () => {
      const next = await core.execute(GetNextAssessment(user.id))
      expect(next).not.to.be.null
      expect(next!.id).to.equal(secondAssessment)
    })
  })
  describe(`
  /         \\  <-- (firstAssessment)         
 | firstItem |  <-- (secondAssessment) --> (secondItem)
  \\         /  <-- (thirdAssessment) ---> (second & third items)
                <-- (fourthAssessment) ---> (second, third & fourth items)
 `, () => {
    let firstItem: Item
    let secondItem: Item
    let thirdItem: Item
    let fourthItem: Item
    let firstAssessment: AssessmentId
    let secondAssessment: AssessmentId
    let thirdAssessment: AssessmentId
    let fourthAssessment: AssessmentId
    beforeEach(async () => {
      firstItem = await createItem('first')
      secondItem = await createItem('second')
      thirdItem = await createItem('third')
      fourthItem = await createItem('fourth')
      await core.execute(AddComponent(userObjective.id, firstItem.id))
      await core.execute(AddComponent(userObjective.id, secondItem.id))
      await core.execute(AddComponent(userObjective.id, thirdItem.id))
      await core.execute(AddComponent(userObjective.id, fourthItem.id))
      firstAssessment = await createMcq('first', [firstItem.id])
      secondAssessment = await createMcq('second', [
        firstItem.id,
        secondItem.id
      ])
      thirdAssessment = await createMcq('third', [
        firstItem.id,
        secondItem.id,
        thirdItem.id
      ])
      fourthAssessment = await createMcq('fourth', [
        firstItem.id,
        secondItem.id,
        thirdItem.id,
        fourthItem.id
      ])
    })
    describe('when first, second and third assessments passed', () => {
      beforeEach(async () => {
        await core.execute(CheckAnswer(user.id, firstAssessment, 0))
        await core.execute(CheckAnswer(user.id, secondAssessment, 0))
        await core.execute(CheckAnswer(user.id, thirdAssessment, 0))
      })
      describe(`when a new single-target assessment is created`, () => {
        let newSingleTargetAssessment: AssessmentId
        beforeEach(async () => {
          newSingleTargetAssessment = await createMcq('new single-target', [
            fourthItem.id
          ])
        })
        it('has new single-target assessment as next', async () => {
          const next = await core.execute(GetNextAssessment(user.id))
          expect(next).not.to.be.null
          expect(next!.id).to.equal(newSingleTargetAssessment)
        })
      })
    })
    describe('when first and second assessments failed, then third assessment passed', () => {
      beforeEach(async () => {
        await core.execute(CheckAnswer(user.id, firstAssessment, 1))
        await core.execute(CheckAnswer(user.id, secondAssessment, 1))
        await core.execute(CheckAnswer(user.id, thirdAssessment, 0))
      })
      describe(`when a new single-target assessment is created`, () => {
        let newSingleTargetAssessment: AssessmentId
        beforeEach(async () => {
          newSingleTargetAssessment = await createMcq('new single-target', [
            fourthItem.id
          ])
        })
        it('has new single-target assessment as next', async () => {
          const next = await core.execute(GetNextAssessment(user.id))
          expect(next).not.to.be.null
          expect(next!.id).to.equal(newSingleTargetAssessment)
        })
      })
    })
  })
})
