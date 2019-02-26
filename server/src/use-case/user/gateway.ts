import { LinkedInUserId } from '../../core/ports/LinkedInGateway'
import { User } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { NodeType } from '../../neo4j/NodeType'

interface UserGateway {
  createUser: (user: User) => Promise<User>
  findLinkedInUser: (linkedInId: LinkedInUserId) => Promise<User | null>
}

export const createUserGateway = (): UserGateway => ({
  createUser: async user => {
    const statement = `
      CREATE (user:${NodeType.User} {
        id: {id},
        linkedInId: {linkedInId},
        firstName: {firstName},
        lastName: {lastName}
      })
      RETURN user`
    const records = await cypher.send(statement, user)
    return records[0].get('user').properties
  },

  findLinkedInUser: async linkedInId => {
    const statement = `
    MATCH (user:${NodeType.User} {
      linkedInId: {linkedInId}
    })
    RETURN user`
    const records = await cypher.send(statement, { linkedInId })
    if (records.length === 0) return null
    return records[0].get('user').properties
  }
})
