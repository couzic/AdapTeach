import { createCreateKnowledgeComponentGateway } from './CreateKnowledgeComponent'
import { createFindKnowledgeComponentByIdGateway } from './FindKnowledgeComponentById'
import { createSearchKnowledgeComponentGateway } from './FindKnowledgeComponentByName'

export const createContributeKnowledgeComponentGateway = () => ({
  ...createCreateKnowledgeComponentGateway(),
  ...createFindKnowledgeComponentByIdGateway(),
  ...createSearchKnowledgeComponentGateway()
})
