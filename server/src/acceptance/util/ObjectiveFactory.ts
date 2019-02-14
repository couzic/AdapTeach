import { Core } from '../../core/Core'
import { KnowledgeCompositeId } from '../../domain/KnowledgeComposite'
import { AddToObjective } from '../../use-case/contribute/objective/AddToObjective'
import { CreateLearningObjective } from '../../use-case/contribute/objective/CreateLearningObjective'

export const createObjectiveFactory = (core: Core) => async (
  name: string,
  components?: KnowledgeCompositeId[]
) => {
  const composite = await core.execute(CreateLearningObjective({ name }))
  if (components) {
    for (let i = 0, l = components.length; i < l; i++) {
      await core.execute(AddToObjective(composite.id, components[i]))
    }
  }
  return composite
}

export type ObjectiveFactory = ReturnType<typeof createObjectiveFactory>
