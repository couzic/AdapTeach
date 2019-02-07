import { ItemId } from './Item'
import { ObjectiveId } from './Objective'

export type AssessmentType = 'MCQ-Single' | 'MCQ-Multi'

export type CodeLanguage = 'ts' | 'typescript' | 'js' | 'javascript'

export interface AssessmentAnswer {
  text: string
  correct?: boolean
}

export interface Assessment {
  type: AssessmentType
  question: {
    text: string
    code?: Array<{ language: string; snippet: string; fileName?: string }>
  }
  answers: AssessmentAnswer[]
  prerequisites: ObjectiveId[]
  assessedItems: ItemId[]
  activelyRecalledItems?: ItemId[]
  passivelyRecalledItems?: ItemId[]
}

export const EMPTY_ASSESSMENT: Assessment = {
  type: 'MCQ-Multi',
  question: { text: '' },
  answers: [{ text: '', correct: true }, { text: '', correct: false }],
  prerequisites: [],
  assessedItems: [],
  activelyRecalledItems: [],
  passivelyRecalledItems: []
}
