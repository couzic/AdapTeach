import { expect } from 'chai'

import { Core, CoreDependencies, createCore } from '../../core/Core'
import { createCoreGateway } from '../../core/CoreGateway'
import { AssessmentId } from '../../domain/Assessment'
import { Composite } from '../../domain/Composite'
import { Item } from '../../domain/Item'
import { User } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { AddPrerequisite } from '../../use-case/contribute/assessment/AddPrerequisite'
import { AddComponent } from '../../use-case/contribute/composite/AddComponent'
import { CreateComposite } from '../../use-case/contribute/composite/CreateComposite'
import { AddLearningObjective } from '../../use-case/learn/AddLearningObjective'
import { GetNextAssessment } from '../../use-case/learn/GetNextAssessment'
import { CreateUser } from '../../use-case/user/CreateUser'
import {
  CompositeFactory,
  createCompositeFactory
} from '../util/CompositeFactory'
import { createItemFactory, ItemFactory } from '../util/ItemFactory'
import { createMcqFactory, McqFactory } from '../util/McqFactory'

describe('Preqs and Out of scope scenario', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let user: User
  let userObjective: Composite
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
    userObjective = await core.execute(
      CreateComposite({ name: 'User objective' })
    )
    await core.execute(AddLearningObjective(user.id, userObjective.id))
  })
  describe(`
     (preq) <-[:HAS_PREQ]- (inScopeAssessment) --> (inScopeItem) <-- (partiallyInScopeAssessment) --> (outOfScopeItem)
    `, () => {
    let preq: Item
    let inScopeItem: Item
    let outOfScopeItem: Item
    let inScopeAssessment: AssessmentId
    let partiallyInScopeAssessment: AssessmentId
    beforeEach(async () => {
      preq = await createItem('preq')
      inScopeItem = await createItem('inScope')
      outOfScopeItem = await createItem('outOfScope')
      await core.execute(AddComponent(userObjective.id, inScopeItem.id))
      inScopeAssessment = await mcqFactory('inScope', [inScopeItem.id])
      partiallyInScopeAssessment = await mcqFactory('partiallyInScope', [
        inScopeItem.id,
        outOfScopeItem.id
      ])
      await core.execute(AddPrerequisite(inScopeAssessment, preq.id))
    })
    it('has "in scope" next assessment', async () => {
      const next = await core.execute(GetNextAssessment(user.id))
      expect(next).not.to.be.null
      expect(next!.id).to.equal(inScopeAssessment)
    })
  })
})
