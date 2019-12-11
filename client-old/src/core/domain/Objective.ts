import { Composite, CompositeId } from './Composite'
import { Item, ItemId } from './Item'

export type ObjectiveId = ItemId | CompositeId

export type Objective = Item | Composite
