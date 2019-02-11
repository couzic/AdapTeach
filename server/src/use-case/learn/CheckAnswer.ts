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
    nextRepetition: number,
    now: number
  ) => Promise<void>
}

export const CheckAnswer = (
  userId: UserId,
  assessmentId: McqId,
  answerId: number
) => async ({
  gateway,
  repetitionScheduler,
  timeProvider
}: CoreDependencies) => {
  const assessment = await gateway.getAssessment(assessmentId)
  const correct = assessment.answers[answerId].correct || false
  const nextRepetition = await repetitionScheduler.next()
  await gateway.setNextRepetition(
    userId,
    assessmentId,
    nextRepetition,
    timeProvider.now()
  )
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
  setNextRepetition: async (userId, assessmentId, nextRepetition, now) => {
    const statement = `
      MATCH (user:User {id: {userId}})
      MATCH (assessment:Assessment {id: {assessmentId}})
      MATCH (item:Item) <-[:ASSESSMENT_FOR]- (assessment)
      OPTIONAL
        MATCH (user) -[triedOther:TRIED]-> (:Assessment) -[:ASSESSMENT_FOR]-> (item)
        SET triedOther.skipped = triedOther.skipped + 1
      MERGE (user) -[learns:LEARNS]-> (item)
        SET learns.nextRepetition = {nextRepetition}
      MERGE (user) -[tried:TRIED]-> (assessment)
        SET tried.skipped = 0
      `
    await cypher.send(statement, {
      userId,
      assessmentId,
      nextRepetition: neo4j.int(nextRepetition),
      now: neo4j.int(now)
    })
  }
})
