import { cypher } from '../neo4j/cypher'

export const cleanupDb = async () => {
  console.log('Cleanup DB first')
  await cypher.send('MATCH ()-[r]-() DELETE r', {})
  await cypher.send('MATCH (n) DELETE n ', {})
  console.log('DB Cleaned up')
}
