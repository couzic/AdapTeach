import { CoreDependencies } from '../../core/Core'
import { ObjectiveId } from '../../domain/Objective'
import { UserId } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'

export interface AddLearningObjectiveGateway {
  addLearningObjective: (
    userId: UserId,
    objectiveId: ObjectiveId
  ) => Promise<void>
}

export const AddLearningObjective = (
  userId: UserId,
  objectiveId: ObjectiveId
) => async ({ gateway }: CoreDependencies) => {
  await gateway.addLearningObjective(userId, objectiveId)
}

export const createAddLearningObjectiveGateway = (): AddLearningObjectiveGateway => ({
  addLearningObjective: async (userId, objectiveId) => {
    const statement = `
        MATCH (user:User {id: {userId}})
        MATCH (objective:Objective {id: {objectiveId}})
        CREATE (user) -[:HAS_OBJECTIVE]-> (objective)
        RETURN user`
    await cypher.send(statement, { userId, objectiveId })
  }
})
