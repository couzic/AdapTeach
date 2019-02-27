import { History } from 'history'

import { createRouter } from './Router'

export interface CoreDependencies {
  history: History
}

export const createCore = (dependencies: CoreDependencies) => {
  const { history } = dependencies
  const router = createRouter(history)
  return { router }
}

export type Core = ReturnType<typeof createCore>
