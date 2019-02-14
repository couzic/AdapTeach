import { cypher } from '../../../neo4j/cypher'
import { UseCaseDependencies } from '../../../core/Core'
import { Assessment, AssessmentId } from '../../../domain/Assessment'
import { NodeType } from '../../../neo4j/NodeType';

export interface SetQuestionGateway {
  setQuestion: (
    assessment: AssessmentId,
    question: string
  ) => Promise<Assessment>
}

export const SetQuestion = (
  assessmentId: AssessmentId,
  question: string
) => async ({ gateway }: UseCaseDependencies) => {
  gateway.setQuestion(assessmentId, question)
}

export const createSetQuestionGateway = (): SetQuestionGateway => ({
  setQuestion: async (assessmentId, question) => {
    const statement = `
        MATCH (assessment:${NodeType.Assessment} {id: {assessmentId}})
        SET assessment.question = {question}
        RETURN assessment`
    const records = await cypher.send(statement, { assessmentId, question })
    return records[0].get('assessment').properties
  }
})
