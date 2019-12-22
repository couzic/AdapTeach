import { UseCaseDependencies } from '../../../core/Core'
import { KnowledgeCompositeWithComponents } from '../../../domain/KnowledgeComposite'
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
  ) => Promise<KnowledgeCompositeWithComponents>
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
    WITH objective
    OPTIONAL MATCH (objective) -[:${RelType.COMPOSED_OF}]-> (component:${NodeType.KC})
    OPTIONAL MATCH (objective) -[:${RelType.COMPOSED_OF}]-> (subObjective:${NodeType.Composite})
    RETURN  objective, COLLECT(component) as components, COLLECT(subObjective) as subObjectives`
    const records = await cypher.send(statement, { objectiveId, childId })
    const objectiveProperties = records[0].get('objective').properties
    const components = records[0].get('components').map(_ => _.properties)
    const subObjectives = records[0].get('subObjectives').map(_ => _.properties)
    return {
      ...objectiveProperties,
      components,
      subObjectives
    }
  }
})
