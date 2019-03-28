import { createCore } from './core/Core'
import { CoreDependencies } from './core/CoreDependencies'
import { createDevDependencies } from './adapters/dev/createDevDependencies'
import { createProdDependencies } from './adapters/prod/createProdDependencies'

let dependencies: CoreDependencies =
  process.env.NODE_ENV === 'development'
    ? createDevDependencies()
    : createProdDependencies()

export const core = createCore(dependencies)
