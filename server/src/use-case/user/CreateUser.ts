import { cypher } from '../../neo4j/cypher'
import { UseCaseDependencies } from '../../core/Core'
import { User, UserFields, UserId } from '../../domain/User'

export interface CreateUserGateway {
  createUser: (user: User) => Promise<User>
}

export const CreateUser = (fields: UserFields) => async ({
  gateway,
  idFactory
}: UseCaseDependencies) =>
  gateway.createUser({
    ...fields,
    id: idFactory.createId() as UserId
  })

export const createCreateUserGateway = (): CreateUserGateway => ({
  createUser: async user => {
    const statement = `
      CREATE (user:User {id: {id}, username: {username}, email: {email}})
      RETURN user`
    const records = await cypher.send(statement, user)
    return records[0].get('user').properties
  }
})
