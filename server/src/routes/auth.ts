import { SignInWithLinkedIn } from '../use-case/user/auth/SignInWithLinkedIn'
import { Route } from './Route'

export const authRoute: Route = (router, core) => {
  router.get('/auth/linkedin/signin', async ctx => {
    ctx.redirect(core.dependencies.linkedIn.authorizationUrl)
  })

  router.get(core.dependencies.linkedIn.callbackPath, async ctx => {
    const { code } = ctx.query
    const user = await core.execute(SignInWithLinkedIn(code))
    ctx.status = 200
    ctx.body = user
  })
}
