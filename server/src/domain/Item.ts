export type ItemId = 'ItemId'

export interface ItemFields {
  name: string
  description?: string
}

export interface Item extends ItemFields {
  id: ItemId
  type: 'ITEM'
}
