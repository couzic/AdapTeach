import { ItemId } from './Item'

export type CompositeId = 'CompositeId'

export interface CompositeFields {
  name: string
  description?: string
}

export interface Composite extends CompositeFields {
  id: CompositeId
  type: 'COMPOSITE'
  subObjectives: Array<ItemId | CompositeId>
}
