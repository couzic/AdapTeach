import { Route } from './Route'

export const authRoute: Route = router => {
  router.get('/auth/linkedin/callback', async ctx => {
    ctx.status = 200
    ctx.body = 'Hello'
  })
}
