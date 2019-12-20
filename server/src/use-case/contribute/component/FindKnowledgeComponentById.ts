import { notFound } from '@hapi/boom'

import { UseCaseDependencies } from '../../../core/Core'
import { KnowledgeComponent } from '../../../domain/KnowledgeComponent'
import { KnowledgeComponentId } from '../../../domain/LearningObjective'
import { cypher } from '../../../neo4j/cypher'
import { NodeType } from '../../../neo4j/NodeType'

export const FindKnowledgeComponentById = (id: KnowledgeComponentId) => async ({
  gateway
}: UseCaseDependencies) => gateway.findKnowledgeComponentById(id)

export interface FindKnowledgeComponentByIdGateway {
  findKnowledgeComponentById: (
    id: KnowledgeComponentId
  ) => Promise<KnowledgeComponent>
}

export const createFindKnowledgeComponentByIdGateway = (): FindKnowledgeComponentByIdGateway => ({
  findKnowledgeComponentById: async id => {
    const statement = `
      MATCH (kc:${NodeType.KC}:${NodeType.Objective} {
        id: {id}
      })
      RETURN kc`
    const records = await cypher.send(statement, { id })
    if (records.length === 0)
      throw notFound('no Knowledge Component found for id ' + id)
    return records[0].get('kc').properties
  }
})
