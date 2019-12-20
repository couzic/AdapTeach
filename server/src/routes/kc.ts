import { KnowledgeComponentFields } from '../domain/KnowledgeComponent'
import { CreateKnowledgeComponent } from '../use-case/contribute/component/CreateKnowledgeComponent'
import { FindKnowledgeComponentById } from '../use-case/contribute/component/FindKnowledgeComponentById'
import { SearchKnowledgeComponent } from '../use-case/contribute/component/SearchKnowledgeComponent'
import { Route } from './Route'

const path = '/kc'

export const kcRoute: Route = (router, core) => {
  router.post(path, async ctx => {
    const kcFields: KnowledgeComponentFields = ctx.request.body
    const kc = await core.execute(CreateKnowledgeComponent(kcFields))
    ctx.status = 200
    ctx.body = kc
  })

  router.get(path + '/:id', async ctx => {
    const { id } = ctx.params
    const kc = await core.execute(FindKnowledgeComponentById(id))
    ctx.status = 200
    ctx.body = kc
  })

  router.get(path + '/search/:q', async ctx => {
    const { q } = ctx.params
    const results = await core.execute(SearchKnowledgeComponent(q))
    ctx.status = 200
    ctx.body = results
  })
}
