import { UseCaseDependencies } from '../../../core/Core'
import { KnowledgeComponent } from '../../../domain/KnowledgeComponent'
import { cypher } from '../../../neo4j/cypher'
import { neo4jIndexes } from '../../../neo4j/neo4jIndexes'

export const SearchKnowledgeComponent = (q: string) => async ({
  gateway
}: UseCaseDependencies) => gateway.searchKnowledgeComponent(q)

export interface SearchKnowledgeComponentGateway {
  searchKnowledgeComponent: (
    q: string
  ) => Promise<Array<{ kc: KnowledgeComponent; score: number }>>
}

export const createSearchKnowledgeComponentGateway = (): SearchKnowledgeComponentGateway => ({
  searchKnowledgeComponent: async q => {
    const statement = `
      CALL db.index.fulltext.queryNodes("${neo4jIndexes.kcNamesAndDescriptions}", "${q}") YIELD node, score
      RETURN node, score`
    const records = await cypher.send(statement, { q })
    const searchResults = records.map(record => ({
      kc: record.get('node').properties,
      score: record.get('score')
    }))
    return searchResults
  }
})
