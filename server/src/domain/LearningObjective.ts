export type LearningObjectiveId = 'LearningObjectiveId'

export interface LearningObjectiveFields {
  name: string
  description?: string
}

export interface LearningObjective extends LearningObjectiveFields {
  id: LearningObjectiveId
}
