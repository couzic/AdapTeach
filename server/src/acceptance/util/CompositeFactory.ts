import { Core } from '../../core/Core'
import { ObjectiveId } from '../../domain/Objective'
import { AddComponent } from '../../use-case/contribute/composite/AddComponent'
import { CreateComposite } from '../../use-case/contribute/composite/CreateComposite'

export const createCompositeFactory = (core: Core) => async (
  name: string,
  components?: ObjectiveId[]
) => {
  const composite = await core.execute(CreateComposite({ name }))
  if (components) {
    for (let i = 0, l = components.length; i < l; i++) {
      await core.execute(AddComponent(composite.id, components[i]))
    }
  }
  return composite
}

export type CompositeFactory = ReturnType<typeof createCompositeFactory>
