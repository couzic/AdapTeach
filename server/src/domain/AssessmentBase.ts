import { KnowledgeComponentId } from './KnowledgeComponent'
import { KnowledgeCompositeId } from './KnowledgeComposite'

export interface AssessmentBase<Fields extends { id: string; type: string }> {
  id: Fields['id']
  type: Fields['type']
  active: boolean
  prerequisites: KnowledgeCompositeId[]
  assessedComponents: KnowledgeComponentId[]
  activelyRecalledItems: KnowledgeComponentId[]
  passivelyRecalledItems: KnowledgeComponentId[]
}
