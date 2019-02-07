import { createCreateCompositeGateway } from './CreateComposite'
import { createAddComponentGateway } from './AddComponent'

export const createContributeCompositeGateway = () => ({
  ...createAddComponentGateway(),
  ...createCreateCompositeGateway()
})
