import { User } from '../../../../../client/src/@shared/User'
import { UseCaseDependencies } from '../../../core/Core'

export const SignInWithLinkedIn = (authorizationCode: string) => async ({
  gateway,
  linkedIn,
  idFactory
}: UseCaseDependencies): Promise<User> => {
  const { token } = await linkedIn.getAccessToken(authorizationCode)
  const linkedInUserProfile = await linkedIn.getUserProfile(token)
  const foundUser = await gateway.findLinkedInUser(linkedInUserProfile.id)
  if (foundUser) {
    return foundUser
  } else {
    const id = idFactory.createId()
    const createdUser = await gateway.createUser({
      id,
      linkedInId: linkedInUserProfile.id,
      firstName: linkedInUserProfile.firstName,
      lastName: linkedInUserProfile.lastName
    })
    return createdUser
  }
}
