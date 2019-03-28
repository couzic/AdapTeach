import { asSequence } from 'sequency'

import { UserId } from '../../../../client/src/@shared/User'
import { CoreDependencies } from '../../core/Core'
import { Schedule } from '../../core/ports/RepetitionScheduler'
import { Assessment, AssessmentId } from '../../domain/Assessment'
import { AssessmentHistory } from '../../domain/AssessmentHistory'
import { KnowledgeComponentId } from '../../domain/KnowledgeComponent'
import { McqId } from '../../domain/Mcq'
import { cypher } from '../../neo4j/cypher'

export interface CheckAnswerGateway {
  getAssessment: (
    userId: UserId,
    assessmentId: AssessmentId
  ) => Promise<{
    assessment: Assessment
    components: Array<{
      id: KnowledgeComponentId
      repetition?: {
        time: number
        delay: number
      }
    }>
    assessments: Array<{
      id: AssessmentId
      assessedComponents: KnowledgeComponentId[]
      history: AssessmentHistory
    }>
  }>
  handlePass: (
    userId: UserId,
    assessmentId: AssessmentId,
    schedule: Schedule,
    now: number
  ) => Promise<void>
  handleFail: (
    userId: UserId,
    assessmentId: AssessmentId,
    schedule: Schedule,
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
  const { assessment, components, assessments } = await gateway.getAssessment(
    userId,
    assessmentId
  )
  const passed = assessment.answers[answerId].correct || false
  const schedule = await repetitionScheduler.next({
    passed,
    assessmentId,
    components,
    assessments
  })
  if (passed) {
    await gateway.handlePass(userId, assessmentId, schedule, timeProvider.now())
  } else {
    await gateway.handleFail(userId, assessmentId, schedule, timeProvider.now())
  }
  return Promise.resolve(passed)
}

const neo4j = require('neo4j-driver').v1

export const createCheckAnswerGateway = (): CheckAnswerGateway => ({
  getAssessment: async (userId, assessmentId) => {
    const statement = `
      MATCH (user:User {id: {userId}})
      MATCH (:Assessment {id: {assessmentId}}) -[:ASSESSMENT_FOR]-> (kc:KC)
      OPTIONAL MATCH assessmentsToComponents = (assessment:Assessment) -[:ASSESSMENT_FOR]-> (kc)
      OPTIONAL MATCH learns = (user) -[:LEARNS]-> (kc)
      OPTIONAL MATCH tried = (user) -[:TRIED]-> (assessment)
      RETURN assessmentsToComponents, learns, tried
    `
    const records = await cypher.send(statement, { userId, assessmentId })

    //////////////////
    // REPETITIONS //
    ////////////////
    const repetitionByKc = {} as Record<
      KnowledgeComponentId,
      { time: number; delay: number }
    >
    records
      .map(record => record.get('learns'))
      .filter(Boolean)
      .map(path => path.segments[0])
      .forEach(segment => {
        const {
          repetitionTime,
          repetitionDelay
        } = segment.relationship.properties
        const repetition = {
          time: repetitionTime.toNumber(),
          delay: repetitionDelay.toNumber()
        }
        const kcId = segment.end.properties.id
        repetitionByKc[kcId] = repetition
      })

    //////////////
    // HISTORY //
    ////////////
    const historyByAssessment = {} as Record<
      AssessmentId,
      Array<{ passed: boolean; time: number }>
    >
    records
      .map(record => record.get('tried'))
      .filter(Boolean)
      .map(path => path.segments[0])
      .forEach(segment => {
        const assessmentId: AssessmentId = segment.end.properties.id
        const history = historyByAssessment[assessmentId] || []
        const { passed, time } = segment.relationship.properties
        history.push({
          passed,
          time: time.toNumber()
        })
        // Maybe it would be better to COLLECT(DISTINCT) in the Cypher query ?
        const dedupedHistory = asSequence(history)
          .distinctBy(_ => _.time)
          .toArray()
        historyByAssessment[assessmentId] = dedupedHistory
      })

    const components = [] as Array<{ id: KnowledgeComponentId }>
    const assessments = [] as Array<{ id: AssessmentId; answers: string }>
    const componentsByAssessment = {} as Record<
      AssessmentId,
      KnowledgeComponentId[]
    >
    records
      .map(_ => _.get('assessmentsToComponents'))
      .map(assessmentToKc => {
        const assessment = assessmentToKc.start.properties
        const kc = assessmentToKc.end.properties
        return { assessment, kc }
      })
      .forEach(({ assessment, kc }) => {
        components.push(kc)
        assessments.push(assessment)
        const targets = componentsByAssessment[assessment.id] || []
        componentsByAssessment[assessment.id] = targets
        targets.push(kc.id)
      })

    const assessmentNodeProperties = asSequence(assessments).find(
      _ => _.id === assessmentId
    )
    const assessment = {
      ...assessmentNodeProperties,
      answers: JSON.parse(assessmentNodeProperties!.answers)
    } as any

    return {
      assessment,
      components: asSequence(components)
        .map(_ => _.id)
        .distinct()
        .map(id => ({ id, repetition: repetitionByKc[id] }))
        .toArray(),
      assessments: asSequence(assessments)
        .map(_ => _.id)
        .distinct()
        .map(id => ({
          id,
          assessedComponents: asSequence(componentsByAssessment[id])
            .distinct()
            .toArray(),
          history: historyByAssessment[id] || []
        }))
        .toArray()
    }
  },

  handlePass: async (userId, assessmentId, schedule, now) => {
    const mainStatement = `
      MATCH (user:User {id: {userId}})
      MATCH (assessment:Assessment {id: {assessmentId}})
      CREATE (user) -[:TRIED {passed: {passed}, time: {now}}]-> (assessment)
      WITH user, assessment
      MATCH (assessment) -[:ASSESSMENT_FOR]-> (target:KC)
      OPTIONAL
        MATCH (otherAssessment:Assessment) -[:ASSESSMENT_FOR]-> (target)
        MERGE (user) -[otherMaybeNext:MAYBE_NEXT]-> (otherAssessment)
        ON CREATE SET otherMaybeNext.skipped = 0
      WITH user, assessment, target, otherMaybeNext, otherMaybeNext.skipped as skipped
        SET otherMaybeNext.skipped = skipped + 1
      MERGE (user) -[maybeNext:MAYBE_NEXT]-> (assessment)
        SET maybeNext.skipped = 0
      `
    await cypher.session().writeTransaction(transaction => {
      transaction.run(mainStatement, {
        userId,
        assessmentId,
        passed: true,
        now: neo4j.int(now)
      })
      Object.keys(schedule).forEach(kcId => {
        const repetitionTime = schedule[kcId]
        const repetitionDelay = repetitionTime - now
        transaction.run(setRepetitionStatement, {
          userId,
          kcId,
          repetitionTime: neo4j.int(repetitionTime),
          repetitionDelay: neo4j.int(repetitionDelay)
        })
      })
    })
  },

  handleFail: async (userId, assessmentId, schedule, now) => {
    const mainStatement = `
      MATCH (user:User {id: {userId}})
      MATCH (assessment:Assessment {id: {assessmentId}})
      CREATE (user) -[:TRIED {passed: {passed}, time: {now}}]-> (assessment)
      WITH user, assessment
      MATCH (assessment) -[:ASSESSMENT_FOR]-> (target:KC)
      MERGE (user) -[maybeNext:MAYBE_NEXT]-> (assessment)
        SET maybeNext.skipped = 0
      WITH user, assessment, target
      OPTIONAL
        MATCH (user) -[otherMaybeNext:MAYBE_NEXT]-> (otherAssessment:Assessment) -[:ASSESSMENT_FOR]-> (target)
        WHERE otherAssessment <> assessment
        WITH otherMaybeNext, otherMaybeNext.skipped as skipped
        SET otherMaybeNext.skipped = skipped + 1
      `

    await cypher.session().writeTransaction(transaction => {
      transaction.run(mainStatement, {
        userId,
        assessmentId,
        passed: false,
        now: neo4j.int(now)
      })
      Object.keys(schedule).forEach(kcId => {
        const repetitionTime = schedule[kcId]
        const repetitionDelay = repetitionTime - now
        transaction.run(setRepetitionStatement, {
          userId,
          kcId,
          repetitionTime: neo4j.int(repetitionTime),
          repetitionDelay: neo4j.int(repetitionDelay)
        })
      })
    })
  }
})

const setRepetitionStatement = `
  MATCH (user:User {id: {userId}})
  MATCH (kc:KC {id: {kcId}})
  MERGE (user) -[learns:LEARNS]-> (kc)
  SET learns.repetitionTime = {repetitionTime}
  SET learns.repetitionDelay = {repetitionDelay}
  `
