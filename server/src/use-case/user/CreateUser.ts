import { UserFields } from '../../../../client/src/@shared/User'
import { UseCaseDependencies } from '../../core/Core'

export const CreateUser = (fields: UserFields) => async ({
  gateway,
  idFactory
}: UseCaseDependencies) =>
  gateway.createUser({
    ...fields,
    id: idFactory.createId()
  })
