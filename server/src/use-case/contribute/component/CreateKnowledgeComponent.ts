import { UseCaseDependencies } from '../../../core/Core'
import {
  KnowledgeComponent,
  KnowledgeComponentFields
} from '../../../domain/KnowledgeComponent'
import { KnowledgeComponentId } from '../../../domain/LearningObjective'
import { cypher } from '../../../neo4j/cypher'
import { NodeType } from '../../../neo4j/NodeType'

export interface CreateKnowledgeComponentGateway {
  createKnowledgeComponent: (
    kc: KnowledgeComponent
  ) => Promise<KnowledgeComponent>
}

export const CreateKnowledgeComponent = (
  fields: KnowledgeComponentFields
) => async ({ gateway, idFactory }: UseCaseDependencies) =>
  gateway.createKnowledgeComponent({
    description: '',
    ...fields,
    id: idFactory.createId() as KnowledgeComponentId
  })

export const createCreateKnowledgeComponentGateway = (): CreateKnowledgeComponentGateway => ({
  createKnowledgeComponent: async kc => {
    const statement = `
      CREATE (kc:${NodeType.KnowledgeComponent}:${NodeType.KnowledgeComposite} {
        id: {id},
        name: {name},
        description: {description}
      })
      RETURN kc`
    const records = await cypher.send(statement, kc)
    return records[0].get('kc').properties
  }
})
