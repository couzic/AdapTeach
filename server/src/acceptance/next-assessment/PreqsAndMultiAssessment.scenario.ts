import { expect } from 'chai'

import { Core, CoreDependencies, createCore } from '../../core/Core'
import { createCoreGateway } from '../../core/CoreGateway'
import { AssessmentId } from '../../domain/Assessment'
import { KnowledgeComponent } from '../../domain/KnowledgeComponent'
import { LearningObjective } from '../../domain/LearningObjective'
import { User } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { CreateKnowledgeComponent } from '../../use-case/contribute/component/CreateKnowledgeComponent'
import { AddToObjective } from '../../use-case/contribute/objective/AddToObjective'
import { CreateLearningObjective } from '../../use-case/contribute/objective/CreateLearningObjective'
import { AddLearningObjective } from '../../use-case/learn/AddLearningObjective'
import { CheckAnswer } from '../../use-case/learn/CheckAnswer'
import { GetNextAssessment } from '../../use-case/learn/GetNextAssessment'
import { CreateUser } from '../../use-case/user/CreateUser'
import { createMcqFactory, McqFactory } from '../util/McqFactory'

describe('Preqs and multi-assessment scenario', () => {
  const gateway = createCoreGateway()
  let dependencies: CoreDependencies
  let core: Core
  let createAssessment: McqFactory
  let user: User
  let objective: LearningObjective
  beforeEach(async () => {
    await cypher.clearDb()
    dependencies = {
      gateway,
      repetitionScheduler: { next: () => Promise.resolve({} as any) },
      timeProvider: { now: () => 0 }
    } as any
    core = createCore(dependencies)
    createAssessment = createMcqFactory(core)
    user = await core.execute(
      CreateUser({
        linkedInId: 'LinkedInUserId',
        firstName: 'firstName',
        lastName: 'lastName'
      })
    )
    objective = await core.execute(
      CreateLearningObjective({ name: 'objective' })
    )
    await core.execute(AddLearningObjective(user.id, objective.id))
  })
  describe('given kc with two assessments (hard one has prerequisite)', () => {
    let kc: KnowledgeComponent
    let easyAssessment: AssessmentId
    let hardAssessment: AssessmentId
    beforeEach(async () => {
      kc = await core.execute(CreateKnowledgeComponent({ name: 'kc' }))
      await core.execute(AddToObjective(objective.id, kc.id))
      easyAssessment = await createAssessment('first', [kc.id])
      const preq = await core.execute(
        CreateKnowledgeComponent({ name: 'preq' })
      )
      hardAssessment = await createAssessment('second', [kc.id], {
        prerequisites: [preq.id]
      })
    })
    describe("when easy assessment passed and it's time to repeat", () => {
      beforeEach(async () => {
        dependencies.repetitionScheduler.next = () =>
          Promise.resolve({
            [kc.id]: 1
          })
        await core.execute(CheckAnswer(user.id, easyAssessment, 0))
        dependencies.timeProvider.now = () => 2
      })
      it('has easy assessment as next', async () => {
        const next = await core.execute(GetNextAssessment(user.id))
        expect(next).not.to.be.null
        expect(next!.id).to.equal(easyAssessment)
      })
    })
  })
})
