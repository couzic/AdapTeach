import { asSequence } from 'sequency'

import { RepetitionScheduler } from '../ports/RepetitionScheduler'
import { TimeProvider } from '../ports/TimeProvider'

const INITIAL_DELAY = 24 * 60 * 60 * 1000 // ONE DAY
const ON_SUCCESS_DELAY_FACTOR = 2
const ON_FAILURE_DELAY_FACTOR = 0.5

export const createSimpleRepetitionScheduler = (
  timeProvider: TimeProvider
): RepetitionScheduler => ({
  next: params => {
    const now = timeProvider.now()
    if (!params || params.history.length === 0) {
      return Promise.resolve(now + INITIAL_DELAY)
    } else {
      const { passed, history } = params
      const latestDelay =
        now -
        asSequence(history)
          .map(_ => _.time)
          .max()!
      const nextDelay =
        latestDelay *
        (passed ? ON_SUCCESS_DELAY_FACTOR : ON_FAILURE_DELAY_FACTOR)
      return Promise.resolve(now + nextDelay)
    }
  }
})
