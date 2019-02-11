import { UseCaseDependencies } from '../../core/Core'
import { Assessment } from '../../domain/Assessment'
import { UserId } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'

export interface GetNextAssessmentGateway {
  nextAssessmentForScheduledItem: (
    userId: UserId,
    now: number
  ) => Promise<Assessment | null>
  nextAssessmentForNewItem: (
    userId: UserId,
    now: number
  ) => Promise<Assessment | null>
}

export const GetNextAssessment = (userId: UserId) => async ({
  gateway,
  timeProvider
}: UseCaseDependencies) => {
  const nextAssessmentForScheduledItem = await gateway.nextAssessmentForScheduledItem(
    userId,
    timeProvider.now()
  )
  if (nextAssessmentForScheduledItem) {
    return nextAssessmentForScheduledItem
  }
  const nextAssessmentForNewItem = await gateway.nextAssessmentForNewItem(
    userId,
    timeProvider.now()
  )
  if (nextAssessmentForNewItem) {
    return nextAssessmentForNewItem
  }
  return null
}

// TODO: Filter active assessments
const scheduledItemMatchClause = `
  MATCH (user:User {id: {userId}}) -[learns:LEARNS]-> (item:Item) <-[:ASSESSMENT_FOR]- (assessment:Assessment)
  WHERE (user) -[:HAS_OBJECTIVE]-> (:Objective) -[:COMPOSED_OF*]-> (item)
  AND   learns.nextRepetition < {now}`

const newItemMatchClause = `
  MATCH (user:User {id: {userId}}) -[:HAS_OBJECTIVE]-> (:Objective) -[:COMPOSED_OF*]-> (item:Item) <-[:ASSESSMENT_FOR]- (assessment:Assessment {active: true})
  WHERE NOT (user) -[:LEARNS]-> (item)`

const baseQuery = `
  OPTIONAL
    MATCH (newPreq:Item)
    WHERE NOT (user) -[:LEARNS]-> (newPreq)
    AND (
      (assessment) -[:HAS_PREREQUISITE]-> (newPreq)
      OR
      (assessment) -[:HAS_PREREQUISITE]-> (:Composite) -[:COMPOSED_OF*]-> (newPreq:Item)
  )
  OPTIONAL
    MATCH (learnedPreq:Item) <-[learns:LEARNS]- (user)
    WHERE learns.nextRepetition < {now}
    AND (
      (assessment) -[:HAS_PREREQUISITE]-> (learnedPreq)
      OR
      (assessment) -[:HAS_PREREQUISITE]-> (:Composite) -[:COMPOSED_OF*]-> (learnedPreq:Item)
    )
  OPTIONAL
    MATCH (assessment) -[:ASSESSMENT_FOR]-> (outOfScopeTarget: Item)
    WHERE NOT (user) -[:HAS_OBJECTIVE]-> (:Composite) -[:COMPOSED_OF*]-> (outOfScopeTarget)
  OPTIONAL
    MATCH (user) -[tried:TRIED]-> (assessment)
  OPTIONAL
    MATCH (assessment) -[:ASSESSMENT_FOR]-> (target:Item)
  WITH
    assessment,
    COUNT(DISTINCT newPreq) + COUNT(DISTINCT learnedPreq) as preqs,
    COUNT(outOfScopeTarget) as outOfScopeTargets,
    exists((user) -[:TRIED]-> (assessment)) as hasBeenTried, tried.skipped as skipped,
    COUNT(target) as targets
  WITH
    assessment,
    preqs,
    outOfScopeTargets,
    hasBeenTried, skipped,
    targets
  RETURN assessment
  ORDER BY outOfScopeTargets, preqs, hasBeenTried, skipped DESC, targets
  LIMIT 1`

export const createGetNextAssessmentGateway = (): GetNextAssessmentGateway => ({
  nextAssessmentForScheduledItem: async (userId, now) => {
    const statement = scheduledItemMatchClause + baseQuery
    const records = await cypher.send(statement, { userId, now })
    if (records.length === 0) return null
    return records[0].get('assessment').properties
  },
  nextAssessmentForNewItem: async (userId, now) => {
    const statement = newItemMatchClause + baseQuery
    const records = await cypher.send(statement, { userId, now })
    if (records.length === 0) return null
    return records[0].get('assessment').properties
  }
})
