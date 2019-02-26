import uuid = require('uuid')

import { CoreGateway } from './CoreGateway'
import { IdFactory } from './ports/IdFactory'
import { LinkedInGateway } from './ports/LinkedInGateway'
import { RepetitionScheduler } from './ports/RepetitionScheduler'
import { TimeProvider } from './ports/TimeProvider'

export interface CoreDependencies {
  gateway: CoreGateway
  idFactory?: IdFactory
  timeProvider: TimeProvider
  repetitionScheduler: RepetitionScheduler
  linkedIn: LinkedInGateway
}

export interface UseCaseDependencies extends CoreDependencies {
  idFactory: IdFactory
}
// export interface Transaction {
//   run: (
//     statement: string,
//     params: object
//   ) => Promise<{ records: Array<{ get: (key: string) => any }> }>
// }

// export interface UseCaseDependencies extends CoreDependencies {
//   transaction: Transaction
// }

export type UseCase<R> = (dependencies: UseCaseDependencies) => Promise<R>

export const createCore = (dependencies: CoreDependencies) => {
  const useCaseDependencies: UseCaseDependencies = {
    idFactory: { createId: () => uuid.v4() },
    ...dependencies
  }
  return {
    execute: async <R>(useCase: UseCase<R>) => useCase(useCaseDependencies),
    dependencies
  }
}

export type Core = ReturnType<typeof createCore>
