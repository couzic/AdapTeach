import { UseCaseDependencies } from '../../../core/Core'
import { Assessment, AssessmentFields } from '../../../domain/Assessment'
import { McqSelection } from '../../../domain/Mcq'
import { cypher } from '../../../neo4j/cypher'

export interface CreateAssessmentGateway {
  createAssessment: (
    assessment: AssessmentFields & { id: string; selection: McqSelection }
  ) => Promise<Assessment>
}

export const CreateAssessment = (fields: AssessmentFields) => async ({
  gateway,
  idFactory
}: UseCaseDependencies) => {
  return gateway.createAssessment({
    ...fields,
    id: idFactory.createId() as any,
    selection: 'SINGLE'
  })
}

export const createCreateAssessmentGateway = (): CreateAssessmentGateway => ({
  createAssessment: async assessment => {
    const statement = `
      CREATE (assessment:Assessment {
        id: {id},
        type: {type},
        active: false
      })
      RETURN assessment`
    const records = await cypher.send(statement, assessment)
    return records[0].get('assessment').properties
  }
})
