import { AssessmentBase } from './AssessmentBase'

export type McqId = 'McqId'

export type McqSelection = 'SINGLE' | 'MULTI'

export interface McqFields {
  type: 'MCQ'
}

export interface Mcq extends AssessmentBase<McqFields & { id: McqId }> {
  question: string
  selection: McqSelection
  answers: McqAnswer[]
}

export interface McqAnswer {
  text: string
  correct?: boolean
}
