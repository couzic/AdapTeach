import { Route } from './Route'

export const helloRoute: Route = router => {
  router.get('/hello', async ctx => {
    ctx.status = 200
    ctx.body = 'Hello'
  })
}
