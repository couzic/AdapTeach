export type CategoryId = 'CategoryId'

export interface Category {
  id: CategoryId
  name: string
  description?: string
  parent?: CategoryId
}
