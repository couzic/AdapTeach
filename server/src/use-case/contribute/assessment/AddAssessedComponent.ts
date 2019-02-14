import { UseCaseDependencies } from '../../../core/Core'
import { Assessment, AssessmentId } from '../../../domain/Assessment'
import { KnowledgeComponentId } from '../../../domain/KnowledgeComponent'
import { cypher } from '../../../neo4j/cypher'
import { NodeType } from '../../../neo4j/NodeType'
import { RelType } from '../../../neo4j/RelType'

export interface AddAssessedComponentGateway {
  addAssessedComponent: (
    assessmentId: AssessmentId,
    componentId: KnowledgeComponentId
  ) => Promise<Assessment>
}
export const AddAssessedComponent = (
  assessmentId: AssessmentId,
  componentId: KnowledgeComponentId
) => async ({ gateway }: UseCaseDependencies) => {
  return gateway.addAssessedComponent(assessmentId, componentId)
}

export const createAddAssessedComponentGateway = (): AddAssessedComponentGateway => ({
  addAssessedComponent: async (assessmentId, componentId) => {
    const statement = `
        MATCH (assessment:${NodeType.Assessment} {id: {assessmentId}})
        MATCH (component:${NodeType.KnowledgeComponent} {id: {componentId}})
        CREATE (assessment) -[:${RelType.ASSESSMENT_FOR}]-> (component)
        RETURN assessment`
    const records = await cypher.send(statement, { assessmentId, componentId })
    return records[0].get('assessment').properties
  }
})
