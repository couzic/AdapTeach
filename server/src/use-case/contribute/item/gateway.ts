import { createCreateItemGateway } from './CreateItem'

export const createContributeItemGateway = () => ({
  ...createCreateItemGateway()
})
