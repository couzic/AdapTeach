import { of } from 'rxjs'

import { Assessment } from '../../core/domain/Assessment'
import { AssessmentEndpoint } from '../../core/ports/AssessmentEndpoint'

const nextAssessment: Assessment = {
  type: 'MCQ-Single',
  question: { text: 'Next assessment question' },
  answers: [
    { text: 'Correct answer', correct: true },
    { text: 'Incorrect answer' }
  ],
  assessedItems: ['ItemId'],
  prerequisites: []
}

export const createDevAssessmentEndpoint = (): AssessmentEndpoint => ({
  fetchNextAssessment: userId => of(nextAssessment)
})
