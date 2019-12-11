import { createFocusableStore, createStore, silentLoggerOptions } from 'lenrix'

import { initialRootState, RootState } from './RootState'

export const createRootStore = () =>
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test'
    ? createStore(initialRootState, {
        logger: silentLoggerOptions
      })
    : createFocusableStore(
        (state: RootState | undefined) => state || initialRootState,
        initialRootState,
        (window as any).__REDUX_DEVTOOLS_EXTENSION__ &&
          (window as any).__REDUX_DEVTOOLS_EXTENSION__()
      )

export type RootStore = ReturnType<typeof createRootStore>
