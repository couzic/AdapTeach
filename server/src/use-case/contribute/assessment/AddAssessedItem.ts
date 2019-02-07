import { cypher } from '../../../neo4j/cypher'
import { UseCaseDependencies } from '../../../core/Core'
import { Assessment, AssessmentId } from '../../../domain/Assessment'
import { ItemId } from '../../../domain/Item'

export interface AddAssessedItemGateway {
  addAssessedItem: (
    assessmentId: AssessmentId,
    itemId: ItemId
  ) => Promise<Assessment>
}
export const AddAssessedItem = (
  assessmentId: AssessmentId,
  itemId: ItemId
) => async ({ gateway }: UseCaseDependencies) => {
  return gateway.addAssessedItem(assessmentId, itemId)
}

export const createAddAssessedItemGateway = (): AddAssessedItemGateway => ({
  addAssessedItem: async (assessmentId, itemId) => {
    const statement = `
        MATCH (assessment:Assessment {id: {assessmentId}})
        MATCH (item:Item {id: {itemId}})
        CREATE (assessment) -[:ASSESSMENT_FOR]-> (item)
        RETURN assessment`
    const records = await cypher.send(statement, { assessmentId, itemId })
    return records[0].get('assessment').properties
  }
})
