import { UseCaseDependencies } from '../../../core/Core'
import {
  LearningObjective,
  LearningObjectiveFields,
  LearningObjectiveId
} from '../../../domain/LearningObjective'
import { cypher } from '../../../neo4j/cypher'
import { NodeType } from '../../../neo4j/NodeType'

export interface CreateLearningObjectiveGateway {
  createLearningObjective: (
    objective: LearningObjective
  ) => Promise<LearningObjective>
}

export const CreateLearningObjective = (
  fields: LearningObjectiveFields
) => async ({ gateway, idFactory }: UseCaseDependencies) =>
  gateway.createLearningObjective({
    description: '',
    ...fields,
    id: idFactory.createId() as LearningObjectiveId
  })

export const createCreateLearningObjectiveGateway = (): CreateLearningObjectiveGateway => ({
  createLearningObjective: async objective => {
    const statement = `
      CREATE (objective:${NodeType.LearningObjective}:${
      NodeType.KnowledgeComposite
    } {
        id: {id},
        name: {name},
        description: {description}
      })
      RETURN objective`
    const records = await cypher.send(statement, objective)
    return records[0].get('objective').properties
  }
})
