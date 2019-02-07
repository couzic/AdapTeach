import { ItemId } from './Item'

export type CompositeId = 'CompositeId'

export interface Composite {
  id: CompositeId
  type: 'COMPOSITE'
  name: string
  description?: string
  subObjectives: (ItemId | CompositeId)[]
}
