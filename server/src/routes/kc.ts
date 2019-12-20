import { FindKnowledgeComponentById } from '../use-case/contribute/component/FindKnowledgeComponentById'
import { SearchKnowledgeComponent } from '../use-case/contribute/component/FindKnowledgeComponentByName'
import { Route } from './Route'

const path = '/kc'

export const kcRoute: Route = (router, core) => {
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
