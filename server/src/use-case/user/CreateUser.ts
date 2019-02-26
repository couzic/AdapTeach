import { UseCaseDependencies } from '../../core/Core'
import { User, UserFields } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { NodeType } from '../../neo4j/NodeType'

export interface CreateUserGateway {
  createUser: (user: User) => Promise<User>
}

export const CreateUser = (fields: UserFields) => async ({
  gateway,
  idFactory
}: UseCaseDependencies) =>
  gateway.createUser({
    ...fields,
    id: idFactory.createId()
  })

export const createCreateUserGateway = (): CreateUserGateway => ({
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
  }
})
