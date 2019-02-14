import { KnowledgeComponent, KnowledgeComponentId } from './KnowledgeComponent'
import { LearningObjective, LearningObjectiveId } from './LearningObjective'

export type KnowledgeCompositeId = KnowledgeComponentId | LearningObjectiveId

export type KnowledgeComposite = KnowledgeComponent | LearningObjective
