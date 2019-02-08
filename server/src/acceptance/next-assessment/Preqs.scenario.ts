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

describe('Preqs scenario', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let user: User
  let composite: Composite
  let createItem: ItemFactory
  let createComposite: CompositeFactory
  let mcqFactory: McqFactory
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
    mcqFactory = createMcqFactory(core)
    user = await core.execute(
      CreateUser({
        username: 'username',
        email: 'email'
      } as any)
    )
    composite = await core.execute(CreateComposite({ name: 'composite' }))
    await core.execute(AddLearningObjective(user.id, composite.id))
  })
  describe(`
    (easyItem) <--------- (easyAssessment)
               <-[:PREQ]- (hardAssessment) --> (hardItem)
    `, () => {
    let easyItem: Item
    let hardItem: Item
    let easyAssessmentId: AssessmentId
    let hardAssessmentId: AssessmentId
    beforeEach(async () => {
      hardItem = await core.execute(
        CreateItem({
          name: 'hard'
        })
      )
      easyItem = await core.execute(
        CreateItem({
          name: 'easy'
        })
      )
      await core.execute(AddComponent(composite.id, easyItem.id))
      await core.execute(AddComponent(composite.id, hardItem.id))
      easyAssessmentId = await mcqFactory('easy', [easyItem.id])
      hardAssessmentId = await mcqFactory('hard', [hardItem.id], {
        prerequisites: [easyItem.id]
      })
    })
    it('has easy next assessment', async () => {
      const next = await core.execute(GetNextAssessment(user.id))
      expect(next).not.to.be.null
      expect(next!.id).to.equal(easyAssessmentId)
    })
  })
  describe(`
  (easyItem) <-- (easyAssessment) -[:PREQ *2]-> (item)
  (hardItem) <-- (hardAssessment) -[:PREQ *1]-> (composite) -[:COMP]-> () -[:COMP *3]-> (item)
  `, () => {
    let easyItem: Item
    let hardItem: Item
    let easyAssessmentId: AssessmentId
    let hardAssessmentId: AssessmentId
    let easyPreq1: Item
    let easyPreq2: Item
    let hardPreq1: Item
    let hardPreq2: Item
    let hardPreq3: Item
    beforeEach(async () => {
      hardItem = await createItem('hard')
      easyItem = await createItem('easy')
      await core.execute(AddComponent(composite.id, easyItem.id))
      await core.execute(AddComponent(composite.id, hardItem.id))
      easyPreq1 = await createItem('easyPreq1')
      easyPreq2 = await createItem('easyPreq2')
      easyAssessmentId = await mcqFactory('easy', [easyItem.id], {
        prerequisites: [easyPreq1.id, easyPreq2.id]
      })
      hardPreq1 = await createItem('hardPreq1')
      hardPreq2 = await createItem('hardPreq2')
      hardPreq3 = await createItem('hardPreq3')
      const hiddenCompositePreq = await createComposite('hiddenCompositePreq', [
        hardPreq1.id,
        hardPreq2.id,
        hardPreq3.id
      ])
      const compositePreq = await createComposite('compositePreq', [
        hiddenCompositePreq.id
      ])
      hardAssessmentId = await mcqFactory('hard', [hardItem.id], {
        prerequisites: [compositePreq.id]
      })
    })
    it('has easy next assessment', async () => {
      const next = await core.execute(GetNextAssessment(user.id))
      expect(next).not.to.be.null
      expect(next!.id).to.equal(easyAssessmentId)
    })
    describe("when both assessments passed and it's time to repeat", () => {
      beforeEach(async () => {
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
    describe('when hard prerequisites are activated', () => {
      beforeEach(async () => {
        const hardPreqAssessmentId = await mcqFactory('hardPreq', [
          hardPreq1.id,
          hardPreq2.id,
          hardPreq3.id
        ])
        await core.execute(CheckAnswer(user.id, hardPreqAssessmentId, 0))
      })
      it('has hard next assessment', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(hardAssessmentId)
      })
      describe("when it's time to repeat", () => {
        beforeEach(() => {
          dependencies.timeProvider.now = () => 2
        })
        it('has easy next assessment', async () => {
          const next = await core.execute(GetNextAssessment(user.id))
          expect(next).not.to.be.null
          expect(next!.id).to.equal(easyAssessmentId)
        })
      })
    })
    describe('when ALL prerequisites are activated once, then only hard prerequisites are active', () => {
      beforeEach(async () => {
        const easyPreqsAssessmentId = await mcqFactory('easyPreqs', [
          easyPreq1.id,
          easyPreq2.id
        ])
        const hardPreqsAssessmentId = await mcqFactory('hardPreqs', [
          hardPreq1.id,
          hardPreq2.id,
          hardPreq3.id
        ])
        await core.execute(CheckAnswer(user.id, easyPreqsAssessmentId, 0))
        await core.execute(CheckAnswer(user.id, hardPreqsAssessmentId, 0))
        dependencies.timeProvider.now = () => 2
        dependencies.repetitionScheduler.next = () => Promise.resolve(3)
        await core.execute(CheckAnswer(user.id, hardPreqsAssessmentId, 0))
      })
      it('has hard next assessment', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(hardAssessmentId)
      })
    })
  })
})
