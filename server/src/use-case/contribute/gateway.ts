import { createContributeAssessmentGateway } from './assessment/gateway'
import { createContributeItemGateway } from './item/gateway'
import { createContributeCompositeGateway } from './composite/gateway'

export const createContributeGateway = () => ({
  ...createContributeAssessmentGateway(),
  ...createContributeCompositeGateway(),
  ...createContributeItemGateway()
})
