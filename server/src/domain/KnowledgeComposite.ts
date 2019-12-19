import {
  KnowledgeCompositeId,
  LearningObjective,
  LearningObjectiveFields
} from './LearningObjective'

export type KnowledgeCompositeFields = LearningObjectiveFields

export interface KnowledgeComposite extends LearningObjective {
  id: KnowledgeCompositeId
}
