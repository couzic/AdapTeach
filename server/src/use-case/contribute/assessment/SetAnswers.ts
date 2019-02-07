import { cypher } from '../../../neo4j/cypher'
import { UseCaseDependencies } from '../../../core/Core'
import { Mcq, McqAnswer, McqId } from '../../../domain/Mcq'

export interface SetAnswersGateway {
  setAnswers: (mcq: McqId, answers: McqAnswer[]) => Promise<Mcq>
}

export const SetAnswers = (assessmentId: McqId, answers: McqAnswer[]) => ({
  gateway
}: UseCaseDependencies) => gateway.setAnswers(assessmentId, answers)

export const createSetAnswersGateway = (): SetAnswersGateway => ({
  setAnswers: async (assessmentId, answers) => {
    const statement = `
        MATCH (assessment:Assessment {id: {assessmentId}})
        SET assessment.answers = {answers}
        RETURN assessment`
    const records = await cypher.send(statement, {
      assessmentId,
      answers: JSON.stringify(answers)
    })
    return records[0].get('assessment').properties
  }
})
