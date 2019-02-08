import { UseCaseDependencies } from '../../../core/Core'
import { Assessment, AssessmentId } from '../../../domain/Assessment'
import { ObjectiveId } from '../../../domain/Objective'
import { cypher } from '../../../neo4j/cypher'

export interface AddPrerequisiteGateway {
  addPrerequisite: (
    assessmentId: AssessmentId,
    prerequisiteId: ObjectiveId
  ) => Promise<Assessment>
}

export const AddPrerequisite = (
  assesmentId: AssessmentId,
  prerequisiteId: ObjectiveId
) => ({ gateway }: UseCaseDependencies) =>
  gateway.addPrerequisite(assesmentId, prerequisiteId)

export const createAddPrerequisiteGateway = (): AddPrerequisiteGateway => ({
  addPrerequisite: async (assessmentId, preqId) => {
    const statement = `
        MATCH (assessment:Assessment {id: {assessmentId}})
        MATCH (preq:Objective {id: {preqId}})
        CREATE (assessment) -[:HAS_PREREQUISITE]-> (preq)
        RETURN assessment`
    const records = await cypher.send(statement, {
      assessmentId,
      preqId
    })
    return records[0].get('assessment').properties
  }
})
