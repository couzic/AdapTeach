import { AssessmentId } from '../../domain/Assessment'
import { AssessmentHistory } from '../../domain/AssessmentHistory'
import { KnowledgeComponentId } from '../../domain/KnowledgeComponent'

export type Schedule = Record<KnowledgeComponentId, number>

export interface RepetitionScheduler {
  next: (params?: {
    assessmentId: AssessmentId
    passed: boolean
    components: Array<{
      id: KnowledgeComponentId
      repetition?: {
        time: number
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
