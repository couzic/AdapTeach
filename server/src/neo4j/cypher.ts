import neo4j from 'neo4j-driver'

import { createNeo4jIndexes } from './createNeo4jIndexes'
import { CypherResult } from './CypherResult'

const url = 'bolt://localhost'

let driver: any

if (process.env.NODE_ENV === 'production') {
  const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL!
  const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER!
  const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD!
  driver = neo4j.driver(
    graphenedbURL,
    neo4j.auth.basic(graphenedbUser, graphenedbPass)
  )
} else {
  const auth = {
    user: 'neo4j',
    pass: 'password'
  }
  driver = neo4j.driver(url, neo4j.auth.basic(auth.user, auth.pass), {
    encrypted: false
  })
}

const send = async (
  statement: string,
  parameters: object
): Promise<CypherResult['records']> => {
  const session = driver.session()
  let result: CypherResult | null = null
  try {
    result = await session.run(statement, parameters)
  } catch (e) {
    console.error('Cypher Error', e)
    throw e
  } finally {
    session.close()
    return result ? result.records : []
  }
}

const session = () => driver.session()

const clearDb = async () => {
  await cypher.send('MATCH ()-[r]-() DELETE r', {})
  await cypher.send('MATCH (n) DELETE n ', {})
}

export const cypher = { send, session, clearDb }

createNeo4jIndexes()
