import { LinkedInUserId } from '../../../server/src/core/ports/LinkedInGateway'

export type UserId = 'UserId'
export type Username = 'Username'
export type Email = 'Email'

export interface UserFields {
  linkedInId: LinkedInUserId
  firstName: string
  lastName: string
}

export interface User extends UserFields {
  id: UserId
  username?: Username
  email?: Email
}
