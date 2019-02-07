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

// TODO: Select assessment which targets least number of inactive items
export const createGetNextAssessmentGateway = (): GetNextAssessmentGateway => ({
  nextAssessmentForScheduledItem: async (userId, scheduledBefore) => {
    const statement = `
    MATCH (user:User {id: {userId}}) -[learns:LEARNS]-> (objective:Objective) <-[target:ASSESSMENT_FOR]- (assessment:Assessment {active: true})
    WHERE learns.nextRepetition < {scheduledBefore}
    WITH assessment, COUNT(target) as targets
    WITH assessment, MIN(targets) as minTargets
    RETURN assessment
    ORDER BY minTargets
    LIMIT 1`
    const records = await cypher.send(statement, { userId, scheduledBefore })
    if (records.length === 0) return null
    return records[0].get('assessment').properties
  },
  nextAssessmentForNewItem: async userId => {
    const statement = `
    MATCH (user:User {id: {userId}}) -[:LEARNS {nextRepetition: 'ASAP'}]-> (objective:Objective) <-[target:ASSESSMENT_FOR]- (assessment:Assessment {active: true})
    WITH assessment, COUNT(target) as targets
    WITH assessment, MIN(targets) as minTargets
    RETURN assessment
    ORDER BY minTargets
    LIMIT 1`
    const records = await cypher.send(statement, { userId })
    if (records.length === 0) return null
    return records[0].get('assessment').properties
  }
})
