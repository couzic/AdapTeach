import { UseCaseDependencies } from '../../../core/Core'
import { User } from '../../../domain/User'

export const SignInWithLinkedIn = (authorizationCode: string) => async ({
  gateway,
  linkedIn,
  idFactory
}: UseCaseDependencies): Promise<User> => {
  const { token } = await linkedIn.getAccessToken(authorizationCode)
  const linkedInUserProfile = await linkedIn.getUserProfile(token)
  const id = idFactory.createId()
  const user = await gateway.createUser({
    id,
    linkedInId: linkedInUserProfile.id,
    firstName: linkedInUserProfile.firstName,
    lastName: linkedInUserProfile.lastName
  })
  return user
}
