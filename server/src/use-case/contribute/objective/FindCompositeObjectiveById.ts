import { notFound } from '@hapi/boom'

import { UseCaseDependencies } from '../../../core/Core'
import { KnowledgeComposite } from '../../../domain/KnowledgeComposite'
import { KnowledgeCompositeId } from '../../../domain/LearningObjective'
import { cypher } from '../../../neo4j/cypher'
import { NodeType } from '../../../neo4j/NodeType'

export const FindCompositeObjectiveById = (id: KnowledgeCompositeId) => async ({
  gateway
}: UseCaseDependencies) => gateway.findCompositeObjectiveById(id)

export interface FindCompositeObjectiveByIdGateway {
  findCompositeObjectiveById: (
    id: KnowledgeCompositeId
  ) => Promise<KnowledgeComposite>
}

export const createFindCompositeObjectiveByIdGateway = (): FindCompositeObjectiveByIdGateway => ({
  findCompositeObjectiveById: async id => {
    const statement = `
      MATCH (objective:${NodeType.Composite}:${NodeType.Objective} {
        id: {id}
      })
      RETURN objective`
    const records = await cypher.send(statement, { id })
    if (records.length === 0) throw notFound('no Objective found for id ' + id)
    return records[0].get('objective').properties
  }
})
