import { getTime } from 'date-fns'

import { TimeProvider } from '../ports/TimeProvider'

export const createRealTimeProvider = (): TimeProvider => ({
  now: () => getTime(new Date())
})
