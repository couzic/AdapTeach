import { cypher } from '../../../neo4j/cypher'
import { UseCaseDependencies } from '../../../core/Core'
import { Item, ItemFields, ItemId } from '../../../domain/Item'

export interface CreateItemGateway {
  createItem: (item: Item) => Promise<Item>
}

export const CreateItem = (fields: ItemFields) => async ({
  gateway,
  idFactory
}: UseCaseDependencies) =>
  gateway.createItem({
    description: '',
    ...fields,
    id: idFactory.createId() as ItemId,
    type: 'ITEM'
  })

export const createCreateItemGateway = (): CreateItemGateway => ({
  createItem: async item => {
    const statement = `
        CREATE (item:Item:Objective {id: {id}, name: {name}, description: {description}})
        RETURN item`
    const records = await cypher.send(statement, item)
    return records[0].get('item').properties
  }
})
