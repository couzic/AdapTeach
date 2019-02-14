import { KnowledgeComponentId } from './KnowledgeComponent'
import { KnowledgeCompositeId } from './KnowledgeComposite'

export interface AssessmentBase<F extends { id: string; type: string }> {
  id: F['id']
  type: F['type']
  active: boolean
  prerequisites: KnowledgeCompositeId[]
  assessedItems: KnowledgeComponentId[]
  activelyRecalledItems: KnowledgeComponentId[]
  passivelyRecalledItems: KnowledgeComponentId[]
}
