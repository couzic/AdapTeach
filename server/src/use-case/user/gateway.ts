import { createCreateUserGateway } from './CreateUser'

export const createUserGateway = () => ({
  ...createCreateUserGateway()
})
