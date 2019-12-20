import { createCreateKnowledgeComponentGateway } from './CreateKnowledgeComponent'
import { createFindKnowledgeComponentByIdGateway } from './FindKnowledgeComponentById'

export const createContributeKnowledgeComponentGateway = () => ({
  ...createCreateKnowledgeComponentGateway(),
  ...createFindKnowledgeComponentByIdGateway()
})
