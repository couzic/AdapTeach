import { UserId } from '../../../../client/src/@shared/User'
import { UseCaseDependencies } from '../../core/Core'
import { Assessment } from '../../domain/Assessment'
import { cypher } from '../../neo4j/cypher'

export interface FindNextAssessmentGateway {
  findNextAssessmentForScheduledKc: (
    userId: UserId,
    now: number
  ) => Promise<Assessment | null>
  findNextAssessmentForNewKc: (
    userId: UserId,
    now: number
  ) => Promise<Assessment | null>
}

export const FindNextAssessment = (userId: UserId) => async ({
  gateway,
  timeProvider
}: UseCaseDependencies) => {
  const nextAssessmentForScheduledKc = await gateway.findNextAssessmentForScheduledKc(
    userId,
    timeProvider.now()
  )
  if (nextAssessmentForScheduledKc) {
    return nextAssessmentForScheduledKc
  }
  const nextAssessmentForNewKc = await gateway.findNextAssessmentForNewKc(
    userId,
    timeProvider.now()
  )
  if (nextAssessmentForNewKc) {
    return nextAssessmentForNewKc
  }
  return null
}

// TODO Write test to make sure inactive assessments are rejected
const scheduledComponentMatchClause = `
  MATCH (user:User {id: {userId}}) -[learns:LEARNS]-> (kc:KC) <-[:ASSESSMENT_FOR]- (assessment:Assessment {active:true})
  WHERE (user) -[:HAS_OBJECTIVE]-> (:Objective) -[:COMPOSED_OF*]-> (kc)
  AND   learns.repetitionTime < {now}`

const newComponentMatchClause = `
  MATCH (user:User {id: {userId}}) -[:HAS_OBJECTIVE]-> (:Objective) -[:COMPOSED_OF*]-> (kc:KC) <-[:ASSESSMENT_FOR]- (assessment:Assessment {active: true})
  WHERE NOT (user) -[:LEARNS]-> (kc)`

const baseQuery = `
  OPTIONAL
    MATCH (assessment) -[:ASSESSMENT_FOR]-> (outOfScopeTarget: KC)
    WHERE NOT (user) -[:HAS_OBJECTIVE]-> (:Objective) -[:COMPOSED_OF*]-> (outOfScopeTarget)
  OPTIONAL
    MATCH (newPreq:KC)
    WHERE NOT (user) -[:LEARNS]-> (newPreq)
    AND (
      (assessment) -[:HAS_PREREQUISITE]-> (newPreq)
      OR
      (assessment) -[:HAS_PREREQUISITE]-> (:Objective) -[:COMPOSED_OF*]-> (newPreq)
    )
  OPTIONAL
    MATCH (learnedPreq:KC) <-[learns:LEARNS]- (user)
    WHERE learns.repetitionTime < {now}
    AND (
      (assessment) -[:HAS_PREREQUISITE]-> (learnedPreq)
      OR
      (assessment) -[:HAS_PREREQUISITE]-> (:Objective) -[:COMPOSED_OF*]-> (learnedPreq)
    )
  OPTIONAL
    MATCH (user) -[maybeNext:MAYBE_NEXT]-> (assessment)
  OPTIONAL
    MATCH (assessment) -[:ASSESSMENT_FOR]-> (target:KC)
  WITH
    assessment,
    COUNT(outOfScopeTarget) as outOfScopeTargets,
    COUNT(DISTINCT newPreq) + COUNT(DISTINCT learnedPreq) as preqs,
    COALESCE(maybeNext.skipped, 0) as skipped,
    COUNT(target) as targets
  WITH
    assessment,
    outOfScopeTargets,
    preqs,
    skipped - targets as priority,
    targets
  RETURN assessment
  ORDER BY outOfScopeTargets, preqs, priority DESC, targets
  LIMIT 1`

const forScheduledKcStatement = scheduledComponentMatchClause + baseQuery
const forNewKcStatement = newComponentMatchClause + baseQuery

export const createFindNextAssessmentGateway = (): FindNextAssessmentGateway => ({
  findNextAssessmentForScheduledKc: async (userId, now) => {
    const records = await cypher.send(forScheduledKcStatement, { userId, now })
    if (records.length === 0) return null
    return records[0].get('assessment').properties
  },
  findNextAssessmentForNewKc: async (userId, now) => {
    const records = await cypher.send(forNewKcStatement, { userId, now })
    if (records.length === 0) return null
    return records[0].get('assessment').properties
  }
})
