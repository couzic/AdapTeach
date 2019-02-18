import { asSequence } from 'sequency'

import { AssessmentHistory } from '../../domain/AssessmentHistory'
import { KnowledgeComponentId } from '../../domain/KnowledgeComponent'
import { RepetitionScheduler, Schedule } from '../ports/RepetitionScheduler'
import { TimeProvider } from '../ports/TimeProvider'

const INITIAL_DELAY = 21 * 60 * 60 * 1000 // 21 hours
const ON_FAILURE_DELAY_FACTOR = 0.5

type Failures = 0 | 1 | 2 | 3 | 4
const cautionFactorByFailures: Record<Failures, number> = {
  0: 1,
  1: 1,
  2: 0.7,
  3: 0.5,
  4: 0.3
}

export const createSimpleRepetitionScheduler = (
  timeProvider: TimeProvider
): RepetitionScheduler => ({
  next: params => {
    if (!params) {
      throw Error('params should NOT be nil')
    } else {
      const now = timeProvider.now()
      const schedule = {} as Schedule
      params.components.forEach(kc => {
        let repetitionDelay = INITIAL_DELAY
        if (kc.repetition) {
          const scheduledDelay = kc.repetition.delay
          const lastScheduledTime = kc.repetition.time - scheduledDelay
          const actualDelay = now - lastScheduledTime
          if (params.passed) {
            repetitionDelay = repetitionDelayWhenPasses(
              scheduledDelay,
              actualDelay,
              extractComponentHistory(kc.id, params.assessments)
            )
          } else {
            repetitionDelay = repetitionDelayWhenFails(scheduledDelay, actualDelay)
          }
        }
        schedule[kc.id] = now + repetitionDelay
      })
      return Promise.resolve(schedule)
    }
  }
})

const repetitionDelayWhenPasses = (
  scheduledDelay: number,
  actualDelay: number,
  history: Array<{ passed: boolean; time: number }>
): number => {
  if (history.length > 0) {
    const recentFailures = asSequence(history)
      .sortedByDescending(_ => _.time)
      .take(4)
      .filter(_ => !_.passed)
      .count()
    const cautionFactor = cautionFactorByFailures[recentFailures]
    return scheduledDelay + actualDelay * cautionFactor
  } else {
    return scheduledDelay + actualDelay
  }
}

const repetitionDelayWhenFails = (scheduledDelay: number, actualDelay: number) => {
  if (actualDelay <= scheduledDelay) {
    return scheduledDelay * ON_FAILURE_DELAY_FACTOR
  } else if (scheduledDelay / actualDelay < ON_FAILURE_DELAY_FACTOR) {
    return scheduledDelay
  } else {
    return actualDelay * ON_FAILURE_DELAY_FACTOR
  }
}

const extractComponentHistory = (
  kcId: KnowledgeComponentId,
  assessments: any[]
): AssessmentHistory => {
  const kcAssessments = assessments.filter(_ =>
    _.assessedComponents.includes(kcId)
  )
  const history = [] as AssessmentHistory
  kcAssessments.forEach(assessment => {
    assessment.history.forEach(event => history.push(event))
  })
  return history
}
