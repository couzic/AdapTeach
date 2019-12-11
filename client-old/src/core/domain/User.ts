export type UserId = 'UserId'
export type Username = 'Username'

export interface User {
  id: UserId
  firstName: string
  lastName: string
  username?: Username
}
