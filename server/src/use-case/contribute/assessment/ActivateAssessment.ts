import { cypher } from '../../../neo4j/cypher'
import { UseCaseDependencies } from '../../../core/Core'
import { Assessment, AssessmentId } from '../../../domain/Assessment'
import { NodeType } from '../../../neo4j/NodeType';

export interface ActivateAssessmentGateway {
  activateAssessment: (assessmentId: AssessmentId) => Promise<Assessment>
}

export const ActivateAssessment = (assessmentId: AssessmentId) => ({
  gateway
}: UseCaseDependencies) => gateway.activateAssessment(assessmentId)

export const createActivateAssessmentGateway = (): ActivateAssessmentGateway => ({
  activateAssessment: async assessmentId => {
    const statement = `
        MATCH (assessment:${NodeType.Assessment} {id: {assessmentId}})
        SET assessment.active = true
        RETURN assessment`
    const records = await cypher.send(statement, {
      assessmentId
    })
    return records[0].get('assessment').properties
  }
})
