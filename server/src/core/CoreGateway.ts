import { createContributeGateway } from '../use-case/contribute/gateway'
import { createLearnGateway } from '../use-case/learn/gateway'
import { createUserGateway } from '../use-case/user/gateway'

export const createCoreGateway = () => ({
  ...createContributeGateway(),
  ...createLearnGateway(),
  ...createUserGateway()
})

export type CoreGateway = ReturnType<typeof createCoreGateway>
