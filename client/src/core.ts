import { createCore } from './core/Core'
import { CoreDependencies } from './core/dependencies/CoreDependencies'
import { createLocalDependencies } from './core/dependencies/createLocalDepencies'
import { createProductionDependencies } from './core/dependencies/createProductionDepencies'

let dependencies: CoreDependencies =
  process.env.NODE_ENV === 'development'
    ? createLocalDependencies()
    : createProductionDependencies()

export const core = createCore(dependencies)
