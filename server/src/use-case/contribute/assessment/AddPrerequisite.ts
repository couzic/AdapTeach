import { UseCaseDependencies } from '../../../core/Core'
import { Assessment, AssessmentId } from '../../../domain/Assessment'
import { KnowledgeCompositeId } from '../../../domain/KnowledgeComposite'
import { cypher } from '../../../neo4j/cypher'
import { NodeType } from '../../../neo4j/NodeType'
import { RelType } from '../../../neo4j/RelType'

export interface AddPrerequisiteGateway {
  addPrerequisite: (
    assessmentId: AssessmentId,
    prerequisiteId: KnowledgeCompositeId
  ) => Promise<Assessment>
}

export const AddPrerequisite = (
  assesmentId: AssessmentId,
  prerequisiteId: KnowledgeCompositeId
) => ({ gateway }: UseCaseDependencies) =>
  gateway.addPrerequisite(assesmentId, prerequisiteId)

export const createAddPrerequisiteGateway = (): AddPrerequisiteGateway => ({
  addPrerequisite: async (assessmentId, preqId) => {
    const statement = `
        MATCH (assessment:${NodeType.Assessment} {id: {assessmentId}})
        MATCH (preq:${NodeType.KnowledgeComposite} {id: {preqId}})
        CREATE (assessment) -[:${RelType.HAS_PREREQUISITE}]-> (preq)
        RETURN assessment`
    const records = await cypher.send(statement, {
      assessmentId,
      preqId
    })
    return records[0].get('assessment').properties
  }
})
