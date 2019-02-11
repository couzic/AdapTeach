import { cypher } from '../neo4j/cypher'

export const cleanupDb = async () => {
  console.log('Cleanup DB first')
  await cypher.clearDb()
  console.log('DB Cleaned up')
}
