export type UserId = 'UserId'
export type Username = 'Username'
export type Email = 'Email'

export interface UserFields {
  username: Username
  email: Email
}

export interface User extends UserFields {
  id: UserId
}
