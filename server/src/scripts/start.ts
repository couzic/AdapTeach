import { getTime } from 'date-fns'

import { createCore } from '../core/Core'
import { createCoreGateway } from '../core/CoreGateway'
import { cleanupDb } from './cleanupDb'
import { learn } from './learn'
import { populateDb } from './populateDb'

const start = async () => {
  await cleanupDb()

  const gateway = createCoreGateway()
  const dependencies = {
    gateway,
    timeProvider: { now: () => getTime(new Date()) },
    repetitionScheduler: {
      next: () => Promise.resolve(dependencies.timeProvider.now() + 1000)
    }
  } as any
  const core = createCore(dependencies)

  await populateDb(core)

  await learn(core)
}

start().then(() => console.log('END'))
