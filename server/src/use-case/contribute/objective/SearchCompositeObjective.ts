import { UseCaseDependencies } from '../../../core/Core'
import { KnowledgeComposite } from '../../../domain/KnowledgeComposite'
import { cypher } from '../../../neo4j/cypher'
import { neo4jIndexes } from '../../../neo4j/neo4jIndexes'

export const SearchCompositeObjective = (q: string) => async ({
  gateway
}: UseCaseDependencies) => gateway.searchCompositeObjective(q)

export interface SearchCompositeObjectiveGateway {
  searchCompositeObjective: (
    q: string
  ) => Promise<Array<{ objective: KnowledgeComposite; score: number }>>
}

export const createSearchCompositeObjectiveGateway = (): SearchCompositeObjectiveGateway => ({
  searchCompositeObjective: async q => {
    const statement = `
      CALL db.index.fulltext.queryNodes("${neo4jIndexes.compositesNamesAndDescriptions}", "${q}") YIELD node, score
      RETURN node, score`
    const records = await cypher.send(statement, { q })
    const searchResults = records.map(record => ({
      objective: record.get('node').properties,
      score: record.get('score')
    }))
    return searchResults
  }
})
