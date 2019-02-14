import { UseCaseDependencies } from '../../core/Core'
import { Assessment } from '../../domain/Assessment'
import { UserId } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'

export interface GetNextAssessmentGateway {
  nextAssessmentForScheduledKc: (
    userId: UserId,
    now: number
  ) => Promise<Assessment | null>
  nextAssessmentForNewKc: (
    userId: UserId,
    now: number
  ) => Promise<Assessment | null>
}

export const GetNextAssessment = (userId: UserId) => async ({
  gateway,
  timeProvider
}: UseCaseDependencies) => {
  const nextAssessmentForScheduledKc = await gateway.nextAssessmentForScheduledKc(
    userId,
    timeProvider.now()
  )
  if (nextAssessmentForScheduledKc) {
    return nextAssessmentForScheduledKc
  }
  const nextAssessmentForNewKc = await gateway.nextAssessmentForNewKc(
    userId,
    timeProvider.now()
  )
  if (nextAssessmentForNewKc) {
    return nextAssessmentForNewKc
  }
  return null
}

// TODO: Filter active assessments
const scheduledComponentMatchClause = `
  MATCH (user:User {id: {userId}}) -[learns:LEARNS]-> (kc:KC) <-[:ASSESSMENT_FOR]- (assessment:Assessment)
  WHERE (user) -[:HAS_OBJECTIVE]-> (:Objective) -[:COMPOSED_OF*]-> (kc)
  AND   learns.nextRepetition < {now}`

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
    WHERE learns.nextRepetition < {now}
    AND (
      (assessment) -[:HAS_PREREQUISITE]-> (learnedPreq)
      OR
      (assessment) -[:HAS_PREREQUISITE]-> (:Objective) -[:COMPOSED_OF*]-> (learnedPreq)
    )
  OPTIONAL
    MATCH (user) -[tried:TRIED]-> (assessment)
  OPTIONAL
    MATCH (assessment) -[:ASSESSMENT_FOR]-> (target:KC)
  WITH
    assessment,
    COUNT(outOfScopeTarget) as outOfScopeTargets,
    COUNT(DISTINCT newPreq) + COUNT(DISTINCT learnedPreq) as preqs,
    COALESCE(tried.skipped, 0) as skipped,
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

export const createGetNextAssessmentGateway = (): GetNextAssessmentGateway => ({
  nextAssessmentForScheduledKc: async (userId, now) => {
    const statement = scheduledComponentMatchClause + baseQuery
    const records = await cypher.send(statement, { userId, now })
    if (records.length === 0) return null
    return records[0].get('assessment').properties
  },
  nextAssessmentForNewKc: async (userId, now) => {
    const statement = newComponentMatchClause + baseQuery
    const records = await cypher.send(statement, { userId, now })
    if (records.length === 0) return null
    return records[0].get('assessment').properties
  }
})
