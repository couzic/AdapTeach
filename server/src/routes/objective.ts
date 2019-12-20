import { KnowledgeCompositeFields } from '../domain/KnowledgeComposite'
import { AddToObjective } from '../use-case/contribute/objective/AddToObjective'
import { CreateLearningObjective } from '../use-case/contribute/objective/CreateLearningObjective'
import { FindCompositeObjectiveById } from '../use-case/contribute/objective/FindCompositeObjectiveById'
import { SearchCompositeObjective } from '../use-case/contribute/objective/SearchCompositeObjective'
import { Route } from './Route'

const path = '/objective'

export const objectiveRoute: Route = (router, core) => {
  router.post(path, async ctx => {
    const fields: KnowledgeCompositeFields = ctx.request.body
    const objective = await core.execute(CreateLearningObjective(fields))
    ctx.status = 200
    ctx.body = objective
  })

  router.get(path + '/:id', async ctx => {
    const { id } = ctx.params
    const objective = await core.execute(FindCompositeObjectiveById(id))
    ctx.status = 200
    ctx.body = objective
  })

  router.get(path + '/search/:q', async ctx => {
    const { q } = ctx.params
    const results = await core.execute(SearchCompositeObjective(q))
    ctx.status = 200
    ctx.body = results
  })

  router.put(path + '/:id/add/:componentId', async ctx => {
    const { id, componentId } = ctx.params
    const objective = await core.execute(AddToObjective(id, componentId))
    ctx.status = 200
    ctx.body = objective
  })
}
