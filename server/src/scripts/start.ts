import { cleanupDb } from './cleanupDb'
import { learn } from './learn'
import { populateDb } from './populateDb'

const start = async () => {
  await cleanupDb()
  await populateDb()
  await learn()
}

start().then(() => console.log('END'))
