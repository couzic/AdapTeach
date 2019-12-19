import { UserId } from '../../../../client/src/@shared/User'
import { CoreDependencies } from '../../core/Core'
import { LearningObjectiveId } from '../../domain/LearningObjective'
import { cypher } from '../../neo4j/cypher'
import { NodeType } from '../../neo4j/NodeType'
import { RelType } from '../../neo4j/RelType'

export interface AddLearningObjectiveGateway {
  addLearningObjective: (
    userId: UserId,
    objectiveId: LearningObjectiveId
  ) => Promise<void>
}

export const AddLearningObjective = (
  userId: UserId,
  objectiveId: LearningObjectiveId
) => async ({ gateway }: CoreDependencies) => {
  await gateway.addLearningObjective(userId, objectiveId)
}

export const createAddLearningObjectiveGateway = (): AddLearningObjectiveGateway => ({
  addLearningObjective: async (userId, objectiveId) => {
    const statement = `
        MATCH (user:${NodeType.User} {id: {userId}})
        MATCH (objective:${NodeType.LearningObjective} {id: {objectiveId}})
        CREATE (user) -[:${RelType.HAS_OBJECTIVE}]-> (objective)
        RETURN user`
    await cypher.send(statement, { userId, objectiveId })
  }
})
