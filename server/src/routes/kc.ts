import { FindKnowledgeComponentById } from '../use-case/contribute/component/FindKnowledgeComponentById'
import { Route } from './Route'

const path = '/kc'

export const kcRoute: Route = (router, core) => {
  router.get(path + '/:id', async ctx => {
    const id = ctx.params.id
    const kc = await core.execute(FindKnowledgeComponentById(id))
    ctx.status = 200
    ctx.body = kc
  })
}
