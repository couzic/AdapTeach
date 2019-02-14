import { CoreDependencies } from '../../core/Core'
import { Assessment, AssessmentId } from '../../domain/Assessment'
import { McqId } from '../../domain/Mcq'
import { UserId } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'
import { NodeType } from '../../neo4j/NodeType'

export interface CheckAnswerGateway {
  getAssessment: (assessmentId: AssessmentId) => Promise<Assessment>
  handlePass: (
    userId: UserId,
    assessmentId: AssessmentId,
    nextRepetition: number,
    now: number
  ) => Promise<void>
  handleFail: (
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
  if (correct) {
    const nextRepetition = await repetitionScheduler.next()
    await gateway.handlePass(
      userId,
      assessmentId,
      nextRepetition,
      timeProvider.now()
    )
  } else {
    const nextRepetition = await repetitionScheduler.next()
    await gateway.handleFail(
      userId,
      assessmentId,
      nextRepetition,
      timeProvider.now()
    )
  }
  return Promise.resolve(correct)
}

const neo4j = require('neo4j-driver').v1

export const createCheckAnswerGateway = (): CheckAnswerGateway => ({
  getAssessment: async id => {
    const statement = `
      MATCH (assessment:${NodeType.Assessment} {id: {id}})
      RETURN assessment`
    const records = await cypher.send(statement, { id })
    const nodeProperties = records[0].get('assessment').properties
    return { ...nodeProperties, answers: JSON.parse(nodeProperties.answers) }
  },
  handlePass: async (userId, assessmentId, nextRepetition, now) => {
    const statement = `
      MATCH (user:User {id: {userId}})
      MATCH (assessment:Assessment {id: {assessmentId}}) -[:ASSESSMENT_FOR]-> (target:KC)
      OPTIONAL
        MATCH (otherAssessment:Assessment) -[:ASSESSMENT_FOR]-> (target)
        MERGE (user) -[triedOther:TRIED]-> (otherAssessment)
        ON CREATE SET triedOther.skipped = 0
      WITH user, assessment, target, triedOther, triedOther.skipped as skipped
        SET triedOther.skipped = skipped + 1
      MERGE (user) -[learns:LEARNS]-> (target)
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
  },
  handleFail: async (userId, assessmentId, nextRepetition, now) => {
    const statement = `
      MATCH (user:User {id: {userId}})
      MATCH (assessment:Assessment {id: {assessmentId}}) -[:ASSESSMENT_FOR]-> (target:KC)
      MERGE (user) -[tried:TRIED]-> (:Assessment)
        ON CREATE SET tried.skipped = 0
      WITH user, assessment, target
      OPTIONAL
        MATCH (user) -[triedOther:TRIED]-> (otherAssessment:Assessment) -[:ASSESSMENT_FOR]-> (target)
        WHERE otherAssessment <> assessment
        WITH triedOther, triedOther.skipped as skipped
        SET triedOther.skipped = skipped + 1
      `
    await cypher.send(statement, {
      userId,
      assessmentId,
      nextRepetition: neo4j.int(nextRepetition),
      now: neo4j.int(now)
    })
  }
})
