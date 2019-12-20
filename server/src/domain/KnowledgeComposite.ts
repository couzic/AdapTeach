import { KnowledgeComponent } from './KnowledgeComponent'
import {
  KnowledgeCompositeId,
  LearningObjective,
  LearningObjectiveFields
} from './LearningObjective'

export type KnowledgeCompositeFields = LearningObjectiveFields

export interface KnowledgeComposite extends LearningObjective {
  id: KnowledgeCompositeId
}

export interface KnowledgeCompositeWithComponents extends KnowledgeComposite {
  components: KnowledgeComponent
}
