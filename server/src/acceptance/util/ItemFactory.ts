import { Core } from '../../core/Core'
import { CreateItem } from '../../use-case/contribute/item/CreateItem'

export const createItemFactory = (core: Core) => async (name: string) =>
  core.execute(CreateItem({ name }))

export type ItemFactory = ReturnType<typeof createItemFactory>
