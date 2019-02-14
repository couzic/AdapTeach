import { createContributeAssessmentGateway } from './assessment/gateway'
import { createContributeKnowledgeComponentGateway } from './component/gateway'
import { createContributeLearningObjectiveGateway } from './objective/gateway'

export const createContributeGateway = () => ({
  ...createContributeAssessmentGateway(),
  ...createContributeLearningObjectiveGateway(),
  ...createContributeKnowledgeComponentGateway()
})
