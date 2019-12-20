import { cypher } from './cypher'
import { neo4jIndexes } from './neo4jIndexes'
import { NodeType } from './NodeType'

const {
  objectivesNamesAndDescriptions,
  kcNamesAndDescriptions,
  compositesNamesAndDescriptions
} = neo4jIndexes
const { Objective, KC, Composite } = NodeType

const dropIndexStatements: string[] = [
  `CALL db.index.fulltext.drop("${objectivesNamesAndDescriptions}")`,
  `CALL db.index.fulltext.drop("${kcNamesAndDescriptions}")`,
  `CALL db.index.fulltext.drop("${compositesNamesAndDescriptions}")`
]

const createIndexStatements: string[] = [
  `CALL db.index.fulltext.createNodeIndex("${objectivesNamesAndDescriptions}",["${Objective}"],["name", "description"])`,
  `CALL db.index.fulltext.createNodeIndex("${kcNamesAndDescriptions}",["${KC}"],["name", "description"])`,
  `CALL db.index.fulltext.createNodeIndex("${compositesNamesAndDescriptions}",["${Composite}"],["name", "description"])`
]

export const createNeo4jIndexes = async () => {
  await sendAll(dropIndexStatements)
  await sendAll(createIndexStatements)
}

const sendAll = async (statements: string[]): Promise<void> => {
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    await cypher.send(statement, {})
  }
}
