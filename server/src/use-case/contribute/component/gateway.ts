import { createCreateKnowledgeComponentGateway } from './CreateKnowledgeComponent'

export const createContributeKnowledgeComponentGateway = () => ({
  ...createCreateKnowledgeComponentGateway()
})
