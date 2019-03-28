import { Assessment } from './domain/Assessment'
import { User } from './domain/User'

export interface RootState {
  signedInUser?: User
  nextAssessment?: Assessment
}

export const initialRootState: RootState = {}
