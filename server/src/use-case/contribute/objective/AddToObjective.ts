import { UseCaseDependencies } from '../../../core/Core'
import { KnowledgeComposite } from '../../../domain/KnowledgeComposite'
import {
  KnowledgeCompositeId,
  LearningObjectiveId
} from '../../../domain/LearningObjective'
import { cypher } from '../../../neo4j/cypher'
import { NodeType } from '../../../neo4j/NodeType'
import { RelType } from '../../../neo4j/RelType'

export interface AddToObjectiveGateway {
  addToObjective: (
    objectiveId: KnowledgeCompositeId,
    childId: LearningObjectiveId
  ) => Promise<KnowledgeComposite>
}

export const AddToObjective = (
  objectiveId: KnowledgeCompositeId,
  childId: LearningObjectiveId
) => async ({ gateway }: UseCaseDependencies) =>
  gateway.addToObjective(objectiveId, childId)

export const createAddToObjectiveGateway = (): AddToObjectiveGateway => ({
  addToObjective: async (objectiveId, childId) => {
    const statement = `
    MATCH   (objective:${NodeType.Composite} {id: {objectiveId}})
    MATCH   (child:${NodeType.Objective} {id: {childId}})
    CREATE  (objective) -[:${RelType.COMPOSED_OF}]-> (child)
    RETURN  objective`
    const records = await cypher.send(statement, { objectiveId, childId })
    return records[0].get('objective').properties
  }
})
