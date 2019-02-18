import { AssessmentId } from '../../domain/Assessment'
import { KnowledgeComponentId } from '../../domain/KnowledgeComponent'
import { AssessmentHistory } from '../../domain/AssessmentHistory'

export type Schedule = Record<KnowledgeComponentId, number>

export interface RepetitionScheduler {
  next: (params?: {
    assessmentId: AssessmentId
    passed: boolean
    components: Array<{
      id: KnowledgeComponentId
      repetition?: {
        next: number
        delay: number
      }
    }>
    assessments: Array<{
      id: AssessmentId
      assessedComponents: KnowledgeComponentId[]
      history: AssessmentHistory
    }>
  }) => Promise<Schedule>
}
