import { Observable } from 'rxjs'

import { UserId } from '../../../@shared/User'
import { Assessment } from '../../domain/Assessment'

export interface AssessmentEndpoint {
  fetchNextAssessment: (userId: UserId) => Observable<Assessment | null>
}
