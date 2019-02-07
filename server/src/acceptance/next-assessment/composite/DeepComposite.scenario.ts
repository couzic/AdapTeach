import { expect } from 'chai'

import { Core, CoreDependencies, createCore } from '../../../core/Core'
import { createCoreGateway } from '../../../core/CoreGateway'
import { AssessmentId } from '../../../domain/Assessment'
import { Composite } from '../../../domain/Composite'
import { Item } from '../../../domain/Item'
import { User } from '../../../domain/User'
import { cypher } from '../../../neo4j/cypher'
import { AddComponent } from '../../../use-case/contribute/composite/AddComponent'
import { CreateComposite } from '../../../use-case/contribute/composite/CreateComposite'
import { CreateItem } from '../../../use-case/contribute/item/CreateItem'
import { AddLearningObjective } from '../../../use-case/learn/AddLearningObjective'
import { GetNextAssessment } from '../../../use-case/learn/GetNextAssessment'
import { CreateUser } from '../../../use-case/user/CreateUser'
import { createMcqFactory, McqFactory } from '../../util/McqFactory'

describe('Deep Composite', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let user: User
  let item: Item
  let deepComposite: Composite
  let intermediateComposite: Composite
  let mcqFactory: McqFactory
  beforeEach(async () => {
    await cypher.clearDb()
    dependencies = {
      gateway,
      timeProvider: { now: () => 0 },
      repetitionScheduler: { next: () => Promise.resolve(1) }
    } as any
    core = createCore(dependencies)
    mcqFactory = createMcqFactory(core)
    user = await core.execute(
      CreateUser({
        username: 'username',
        email: 'email'
      } as any)
    )
    item = await core.execute(
      CreateItem({
        name: 'itemName'
      })
    )
    deepComposite = await core.execute(CreateComposite({ name: 'deep' }))
    intermediateComposite = await core.execute(
      CreateComposite({ name: 'intermediate' })
    )
    await core.execute(AddComponent(deepComposite.id, intermediateComposite.id))
    await core.execute(AddComponent(intermediateComposite.id, item.id))
    await core.execute(AddLearningObjective(user.id, deepComposite.id))
  })
  describe('given single assessment', () => {
    let assessmentId: AssessmentId
    beforeEach(async () => {
      assessmentId = await mcqFactory('assessment', [item.id])
    })
    it('has next assessment', async () => {
      const next = await core.execute(GetNextAssessment(user.id))
      expect(next).not.to.be.null
    })
  })
})
