import { notFound } from '@hapi/boom'

import { UseCaseDependencies } from '../../../core/Core'
import { KnowledgeCompositeWithComponents } from '../../../domain/KnowledgeComposite'
import { KnowledgeCompositeId } from '../../../domain/LearningObjective'
import { cypher } from '../../../neo4j/cypher'
import { NodeType } from '../../../neo4j/NodeType'
import { RelType } from '../../../neo4j/RelType'

export const FindCompositeObjectiveById = (id: KnowledgeCompositeId) => async ({
  gateway
}: UseCaseDependencies) => gateway.findCompositeObjectiveById(id)

export interface FindCompositeObjectiveByIdGateway {
  findCompositeObjectiveById: (
    id: KnowledgeCompositeId
  ) => Promise<KnowledgeCompositeWithComponents>
}

export const createFindCompositeObjectiveByIdGateway = (): FindCompositeObjectiveByIdGateway => ({
  findCompositeObjectiveById: async id => {
    const statement = `
      MATCH (objective:${NodeType.Composite} {id: {id}})
      OPTIONAL MATCH (objective) -[:${RelType.COMPOSED_OF}]-> (component:${NodeType.KC})
      OPTIONAL MATCH (objective) -[:${RelType.COMPOSED_OF}]-> (subObjective:${NodeType.Composite})
      RETURN objective, COLLECT(component) as components, COLLECT(subObjective) as subObjectives`
    const records = await cypher.send(statement, { id })
    if (records.length === 0) throw notFound('no Objective found for id ' + id)
    const objectiveProperties = records[0].get('objective').properties
    const components = records[0].get('components').map(_ => _.properties)
    const subObjectives = records[0].get('subObjectives').map(_ => _.properties)
    const objective = {
      ...objectiveProperties,
      components,
      subObjectives
    }
    return objective
  }
})
