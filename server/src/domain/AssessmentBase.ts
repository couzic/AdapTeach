import { ItemId } from './Item'
import { ObjectiveId } from './Objective'

export interface AssessmentBase<F extends { id: string; type: string }> {
  id: F['id']
  type: F['type']
  active: boolean
  prerequisites: ObjectiveId[]
  assessedItems: ItemId[]
  activelyRecalledItems: ItemId[]
  passivelyRecalledItems: ItemId[]
}
