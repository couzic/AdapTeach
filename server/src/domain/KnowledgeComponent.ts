import {
  KnowledgeComponentId,
  LearningObjective,
  LearningObjectiveFields
} from './LearningObjective'

export type KnowledgeComponentFields = LearningObjectiveFields

export interface KnowledgeComponent extends LearningObjective {
  id: KnowledgeComponentId
}
