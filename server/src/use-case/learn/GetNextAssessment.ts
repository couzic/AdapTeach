import { UseCaseDependencies } from '../../core/Core'
import { Assessment } from '../../domain/Assessment'
import { UserId } from '../../domain/User'
import { cypher } from '../../neo4j/cypher'

export interface GetNextAssessmentGateway {
  nextAssessmentForScheduledItem: (
    userId: UserId,
    scheduledBefore: number
  ) => Promise<Assessment | null>
  nextAssessmentForNewItem: (userId: UserId) => Promise<Assessment | null>
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
    userId
  )
  if (nextAssessmentForNewItem) {
    return nextAssessmentForNewItem
  }
  return null
}

export const createGetNextAssessmentGateway = (): GetNextAssessmentGateway => ({
  nextAssessmentForScheduledItem: async (userId, scheduledBefore) => {
    const statement = `
    MATCH (user:User {id: {userId}}) -[learns:LEARNS]-> (objective:Objective) <-[target:ASSESSMENT_FOR]- (assessment:Assessment {active: true})
    WHERE learns.nextRepetition = 'ASAP'
    OR    learns.nextRepetition < {scheduledBefore}
    WITH  user, assessment, COUNT(target) as targets
    WITH  user, assessment, MIN(targets) as minTargets
    MATCH (user) -[learns:LEARNS]-> (objective:Objective) <-[target:ASSESSMENT_FOR]- (assessment)
    WHERE learns.nextRepetition <> 'ASAP'
    RETURN assessment
    ORDER BY minTargets
    LIMIT 1`
    const records = await cypher.send(statement, { userId, scheduledBefore })
    if (records.length === 0) return null
    return records[0].get('assessment').properties
  },
  nextAssessmentForNewItem: async userId => {
    const statement = `
    MATCH (user:User {id: {userId}}), (objective:Objective) <-[target:ASSESSMENT_FOR]- (assessment:Assessment {active: true})
    WHERE (user) -[:LEARNS {nextRepetition: 'ASAP'}]-> (objective) <-[target:ASSESSMENT_FOR]- (assessment)
    OR    (user) -[:LEARNS]-> (:Composite) -[:COMPOSED_OF*]-> (objective) <-[target:ASSESSMENT_FOR]- (assessment)
    WITH  assessment, COUNT(target) as targets
    WITH  assessment, MIN(targets) as minTargets
    RETURN assessment
    ORDER BY minTargets
    LIMIT 1`
    const records = await cypher.send(statement, { userId })
    if (records.length === 0) return null
    return records[0].get('assessment').properties
  }
})
