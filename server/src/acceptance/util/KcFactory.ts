import { Core } from '../../core/Core'
import { CreateKnowledgeComponent } from '../../use-case/contribute/component/CreateKnowledgeComponent'

export const createKcFactory = (core: Core) => async (name: string) =>
  core.execute(CreateKnowledgeComponent({ name }))

export type KcFactory = ReturnType<typeof createKcFactory>
