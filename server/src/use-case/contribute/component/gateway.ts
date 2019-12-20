import { createCreateKnowledgeComponentGateway } from './CreateKnowledgeComponent'
import { createFindKnowledgeComponentByIdGateway } from './FindKnowledgeComponentById'
import { createSearchKnowledgeComponentGateway } from './SearchKnowledgeComponent'

export const createContributeKnowledgeComponentGateway = () => ({
  ...createCreateKnowledgeComponentGateway(),
  ...createFindKnowledgeComponentByIdGateway(),
  ...createSearchKnowledgeComponentGateway()
})
