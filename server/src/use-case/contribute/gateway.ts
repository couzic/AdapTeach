import { createContributeAssessmentGateway } from './assessment/gateway'
import { createContributeItemGateway } from './item/gateway'

export const createContributeGateway = () => ({
  ...createContributeAssessmentGateway(),
  ...createContributeItemGateway()
})
