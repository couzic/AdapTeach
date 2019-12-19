import { KnowledgeComponentId, LearningObjectiveId } from './LearningObjective'

export interface AssessmentBase<Fields extends { id: string; type: string }> {
  id: Fields['id']
  type: Fields['type']
  active: boolean
  prerequisites: LearningObjectiveId[]
  assessedComponents: KnowledgeComponentId[]
  activelyRecalledComponents: KnowledgeComponentId[]
  passivelyRecalledComponents: KnowledgeComponentId[]
}
