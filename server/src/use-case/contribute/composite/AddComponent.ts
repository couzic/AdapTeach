import { UseCaseDependencies } from '../../../core/Core'
import { Composite, CompositeId } from '../../../domain/Composite'
import { ObjectiveId } from '../../../domain/Objective'
import { cypher } from '../../../neo4j/cypher'

export interface AddComponentGateway {
  addComponent: (
    compositeId: CompositeId,
    objectiveId: ObjectiveId
  ) => Promise<Composite>
}

export const AddComponent = (
  compositeId: CompositeId,
  objectiveId: ObjectiveId
) => async ({ gateway }: UseCaseDependencies) =>
  gateway.addComponent(compositeId, objectiveId)

export const createAddComponentGateway = (): AddComponentGateway => ({
  addComponent: async (compositeId, objectiveId) => {
    const statement = `
    MATCH   (composite:Composite {id: {compositeId}})
    MATCH   (objective:Objective {id: {objectiveId}})
    CREATE  (composite) -[:COMPOSED_OF]-> (objective)
    RETURN  composite`
    const records = await cypher.send(statement, { compositeId, objectiveId })
    return records[0].get('composite').properties
  }
})
