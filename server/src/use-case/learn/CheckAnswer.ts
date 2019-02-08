import { cypher } from '../../neo4j/cypher'
import { CoreDependencies } from '../../core/Core'
import { Assessment, AssessmentId } from '../../domain/Assessment'
import { McqId } from '../../domain/Mcq'
import { UserId } from '../../domain/User'

export interface CheckAnswerGateway {
  getAssessment: (assessmentId: AssessmentId) => Promise<Assessment>
  setNextRepetition: (
    userId: UserId,
    assessmentId: AssessmentId,
    time: number
  ) => Promise<void>
}

export const CheckAnswer = (
  userId: UserId,
  assessmentId: McqId,
  answerId: number
) => async ({ gateway, repetitionScheduler }: CoreDependencies) => {
  const assessment = await gateway.getAssessment(assessmentId)
  const correct = assessment.answers[answerId].correct || false
  const nextRepetition = await repetitionScheduler.next()
  await gateway.setNextRepetition(userId, assessmentId, nextRepetition)
  return Promise.resolve(correct)
}

const neo4j = require('neo4j-driver').v1

export const createCheckAnswerGateway = (): CheckAnswerGateway => ({
  getAssessment: async id => {
    const statement = `
      MATCH (assessment:Assessment {id: {id}})
      RETURN assessment`
    const records = await cypher.send(statement, { id })
    const nodeProperties = records[0].get('assessment').properties
    return { ...nodeProperties, answers: JSON.parse(nodeProperties.answers) }
  },
  setNextRepetition: async (userId, assessmentId, time) => {
    const statement = `
      MATCH (user:User {id: {userId}})
      MATCH (item:Item) <-[:ASSESSMENT_FOR]- (assessment:Assessment {id: {assessmentId}})
      MERGE (user) -[learns:LEARNS]-> (item)
      SET   learns.nextRepetition = {time}`
    await cypher.send(statement, {
      userId,
      assessmentId,
      time: neo4j.int(time)
    })
  }
})
