import { UseCaseDependencies } from '../../core/Core'
import { UserFields } from '../../domain/User'

export const CreateUser = (fields: UserFields) => async ({
  gateway,
  idFactory
}: UseCaseDependencies) =>
  gateway.createUser({
    ...fields,
    id: idFactory.createId()
  })
