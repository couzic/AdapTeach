import { UseCaseDependencies } from '../../../core/Core'
import {
  KnowledgeComposite,
  KnowledgeCompositeFields
} from '../../../domain/KnowledgeComposite'
import { KnowledgeCompositeId } from '../../../domain/LearningObjective'
import { cypher } from '../../../neo4j/cypher'
import { NodeType } from '../../../neo4j/NodeType'

export interface CreateLearningObjectiveGateway {
  createLearningObjective: (
    objective: KnowledgeComposite
  ) => Promise<KnowledgeComposite>
}

export const CreateLearningObjective = (
  fields: KnowledgeCompositeFields
) => async ({ gateway, idFactory }: UseCaseDependencies) =>
  gateway.createLearningObjective({
    description: '',
    ...fields,
    id: idFactory.createId() as KnowledgeCompositeId
  })

export const createCreateLearningObjectiveGateway = (): CreateLearningObjectiveGateway => ({
  createLearningObjective: async objective => {
    const statement = `
      CREATE (objective:${NodeType.Composite}:${NodeType.Objective} {
        id: {id},
        name: {name},
        description: {description}
      })
      RETURN objective`
    const records = await cypher.send(statement, objective)
    return records[0].get('objective').properties
  }
})
