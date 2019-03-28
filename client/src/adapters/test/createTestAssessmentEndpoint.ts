import { never } from 'rxjs'

import { AssessmentEndpoint } from '../../core/ports/AssessmentEndpoint'

export const createTestAssessmentEndpoint = (): AssessmentEndpoint => ({
  fetchNextAssessment: () => never()
})
