import 'mocha'

import chai from 'chai'
import sinonChai from 'sinon-chai'

import { Core, CoreDependencies, createCore } from '../../core/Core'
import { createCoreGateway } from '../../core/CoreGateway'
import { KnowledgeComponent } from '../../domain/KnowledgeComponent'
import { KnowledgeComposite } from '../../domain/KnowledgeComposite'
import { User } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { CreateKnowledgeComponent } from '../../use-case/contribute/component/CreateKnowledgeComponent'
import { AddToObjective } from '../../use-case/contribute/objective/AddToObjective'
import { CreateLearningObjective } from '../../use-case/contribute/objective/CreateLearningObjective'
import { FindCompositeObjectiveById } from '../../use-case/contribute/objective/FindCompositeObjectiveById'
import { AddLearningObjective } from '../../use-case/learn/AddLearningObjective'
import { CreateUser } from '../../use-case/user/CreateUser'
import { createMcqFactory, McqFactory } from '../util/McqFactory'

chai.use(sinonChai)
const { expect } = chai

describe('Single Knowledge Component scenario', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let user: User
  let kc: KnowledgeComponent
  let subObjective: KnowledgeComposite
  let userObjective: KnowledgeComposite
  let mcqFactory: McqFactory
  beforeEach(async () => {
    await cypher.clearDb()
    dependencies = {
      gateway,
      timeProvider: { now: () => 0 },
      repetitionScheduler: { next: () => Promise.resolve({}) }
    } as any
    core = createCore(dependencies)
    mcqFactory = createMcqFactory(core)
    user = await core.execute(
      CreateUser({
        linkedInId: 'LinkedInUserId',
        firstName: 'firstName',
        lastName: 'lastName'
      })
    )
    kc = await core.execute(
      CreateKnowledgeComponent({
        name: 'kcName'
      })
    )
    subObjective = await core.execute(
      CreateLearningObjective({ name: 'Sub objective' })
    )
    userObjective = await core.execute(
      CreateLearningObjective({ name: 'User objective' })
    )
    await core.execute(AddToObjective(subObjective.id, kc.id))
    await core.execute(AddToObjective(userObjective.id, subObjective.id))
    await core.execute(AddLearningObjective(user.id, subObjective.id))
  })
  it('returns objective components', async () => {
    const objective = await core.execute(
      FindCompositeObjectiveById(subObjective.id)
    )
    expect(objective.components).to.deep.equal([kc])
  })
  it('returns objective sub-objectives', async () => {
    const objective = await core.execute(
      FindCompositeObjectiveById(userObjective.id)
    )
    expect(objective.subObjectives).to.deep.equal([subObjective])
  })
  it('returns components on add', async () => {
    const anotherObjective = await core.execute(
      CreateLearningObjective({ name: 'Another Objective' })
    )
    const onAdd = await core.execute(AddToObjective(anotherObjective.id, kc.id))
    expect(onAdd.components).to.deep.equal([kc])
  })
  it('returns sub-objectives on add', async () => {
    const anotherObjective = await core.execute(
      CreateLearningObjective({ name: 'Another Objective' })
    )
    const onAdd = await core.execute(
      AddToObjective(anotherObjective.id, subObjective.id)
    )
    expect(onAdd.subObjectives).to.deep.equal([subObjective])
  })
})
