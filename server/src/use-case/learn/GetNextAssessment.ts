import { cypher } from '../../neo4j/cypher'
import { UseCaseDependencies } from '../../core/Core'
import { Assessment } from '../../domain/Assessment'
import { Item, ItemId } from '../../domain/Item'
import { UserId } from '../../domain/User'

export interface GetNextAssessmentGateway {
  getNextScheduledItem: (
    userId: UserId,
    scheduledBefore: number
  ) => Promise<Item | null>
  getNextNewItem: (userId: UserId) => Promise<Item | null>
  getNextAssessment: (userId: UserId, itemId: ItemId) => Promise<Assessment>
}

export const GetNextAssessment = (userId: UserId) => async ({
  gateway,
  timeProvider
}: UseCaseDependencies) => {
  const nextScheduledItem = await gateway.getNextScheduledItem(
    userId,
    timeProvider.now()
  )
  if (nextScheduledItem) {
    const assessment = await gateway.getNextAssessment(
      userId,
      nextScheduledItem.id
    )
    return assessment
  } else {
    const nextItem = await gateway.getNextNewItem(userId)
    if (nextItem === null) return null
    const assessment = await gateway.getNextAssessment(userId, nextItem.id)
    return assessment
  }
}

export const createGetNextAssessmentGateway = (): GetNextAssessmentGateway => ({
  getNextScheduledItem: async (userId, scheduledBefore) => {
    const statement = `
    MATCH (user:User {id: {userId}}) -[learns:LEARNS]-> (objective:Objective) <-[:ASSESSMENT_FOR]- (assessment:Assessment {active: true})
    WHERE learns.nextRepetition < {scheduledBefore}
    RETURN assessment`
    const records = await cypher.send(statement, { userId, scheduledBefore })
    if (records.length === 0) return null
    return records[0].get('assessment').properties
  },
  getNextNewItem: async userId => {
    const statement = `
    MATCH (user:User {id: {userId}}) -[:LEARNS {nextRepetition: 'ASAP'}]-> (objective:Objective) <-[:ASSESSMENT_FOR]- (assessment:Assessment {active: true})
    RETURN assessment`
    const records = await cypher.send(statement, { userId })
    if (records.length === 0) return null
    return records[0].get('assessment').properties
  },
  getNextAssessment: async (userId, itemId) => {
    const statement = `
    MATCH (user:User {id: {userId}}) -[:LEARNS]-> (objective:Objective) <-[:ASSESSMENT_FOR]- (assessment:Assessment {active: true})
    RETURN assessment`
    const records = await cypher.send(statement, { userId })
    if (records.length === 0) return null
    return records[0].get('assessment').properties
  }
})
