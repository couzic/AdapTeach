export interface CoreDependencies {}

export const createCore = (dependencies: CoreDependencies) => {
  return {}
}

export type Core = ReturnType<typeof createCore>
