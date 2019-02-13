import { createSimpleRepetitionScheduler } from '../core/adapters/SimpleRepetitionScheduler'
import { createRealTimeProvider } from '../core/adapters/RealTimeProvider'
import { createCore } from '../core/Core'
import { createCoreGateway } from '../core/CoreGateway'
import { cleanupDb } from './cleanupDb'
import { learn } from './learn'
import { populateDb } from './populateDb'

const start = async () => {
  await cleanupDb()

  const gateway = createCoreGateway()
  const timeProvider = createRealTimeProvider()
  const repetitionScheduler = createSimpleRepetitionScheduler(timeProvider)
  const core = createCore({
    gateway,
    timeProvider,
    repetitionScheduler
  })

  await populateDb(core)

  await learn(core)
}

start().then(() => console.log('END'))
