import { User } from './domain/User'

export interface RootState {
  signedInUser?: User
}

export const initialRootState: RootState = {}
