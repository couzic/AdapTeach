import { CategoryId } from './Category'

export type ItemId = 'ItemId'

export interface Item {
  //   category: CategoryId
  id: ItemId
  type: 'ITEM'
  name: string
  description?: string
}
