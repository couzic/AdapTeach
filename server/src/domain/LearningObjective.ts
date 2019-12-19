export type KnowledgeComponentId = 'KnowledgeComponentId'
export type KnowledgeCompositeId = 'KnowledgeCompositeId'

export type LearningObjectiveId = KnowledgeComponentId | KnowledgeCompositeId

export interface LearningObjectiveFields {
  name: string
  description?: string
}

export interface LearningObjective extends LearningObjectiveFields {
  id: LearningObjectiveId
}
