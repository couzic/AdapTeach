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
import { createMcqFactory, McqFactory } from '../util/McqFactory'

describe('Multi-assessment scenario', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let createAssessment: McqFactory
  let user: User
  let objective: Composite
  beforeEach(async () => {
    await cypher.clearDb()
    dependencies = {
      gateway,
      repetitionScheduler: { next: () => Promise.resolve(1) },
      timeProvider: { now: () => 0 }
    }
    core = createCore(dependencies)
    createAssessment = createMcqFactory(core)
    user = await core.execute(
      CreateUser({ username: 'user', email: 'email' } as any)
    )
    objective = await core.execute(CreateComposite({ name: 'objective' }))
    await core.execute(AddLearningObjective(user.id, objective.id))
  })
  describe('given item with two assessments', () => {
    let item: Item
    let firstAssessment: AssessmentId
    let secondAssessment: AssessmentId
    beforeEach(async () => {
      item = await core.execute(CreateItem({ name: 'item' }))
      await core.execute(AddComponent(objective.id, item.id))
      firstAssessment = await createAssessment('first', [item.id])
      secondAssessment = await createAssessment('second', [item.id])
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
    })
    describe("when both assessments passed and it's time to repeat", () => {
      beforeEach(async () => {
        await core.execute(CheckAnswer(user.id, firstAssessment, 0))
        dependencies.timeProvider.now = () => 2
        dependencies.repetitionScheduler.next = () => Promise.resolve(3)
        await core.execute(CheckAnswer(user.id, secondAssessment, 0))
        dependencies.timeProvider.now = () => 4
      })
      it('has first assessment as next', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(firstAssessment)
      })
    })
  })
})
