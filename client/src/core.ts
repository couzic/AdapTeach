import { createBrowserHistory } from 'history'

import { createCore } from './core/Core'

export const core = createCore({
  history: createBrowserHistory()
})
