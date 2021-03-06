import { UseCaseDependencies } from '../../../core/Core'
import { LearningObjective, LearningObjectiveId } from '../../../domain/LearningObjective'
import { KnowledgeCompositeId } from '../../../domain/KnowledgeComposite'
import { cypher } from '../../../neo4j/cypher'
import { NodeType } from '../../../neo4j/NodeType';
import { RelType } from '../../../neo4j/RelType';

export interface AddToObjectiveGateway {
  addToObjective: (
    objectiveId: LearningObjectiveId,
    childId: KnowledgeCompositeId
  ) => Promise<LearningObjective>
}

export const AddToObjective = (
  objectiveId: LearningObjectiveId,
  childId: KnowledgeCompositeId
) => async ({ gateway }: UseCaseDependencies) =>
  gateway.addToObjective(objectiveId, childId)

export const createAddToObjectiveGateway = (): AddToObjectiveGateway => ({
  addToObjective: async (objectiveId, childId) => {
    const statement = `
    MATCH   (objective:${NodeType.LearningObjective} {id: {objectiveId}})
    MATCH   (child:${NodeType.KnowledgeComposite} {id: {childId}})
    CREATE  (objective) -[:${RelType.COMPOSED_OF}]-> (child)
    RETURN  objective`
    const records = await cypher.send(statement, { objectiveId, childId })
    return records[0].get('objective').properties
  }
})
