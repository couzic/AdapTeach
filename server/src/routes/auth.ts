import jwt from 'jsonwebtoken'

import { SignInWithLinkedIn } from '../use-case/user/auth/SignInWithLinkedIn'
import { Route } from './Route'

const secret = process.env.JWT_SECRET!

export const authRoute: Route = (router, core) => {
  router.get('/auth/linkedin/signin', async ctx => {
    ctx.redirect(core.dependencies.linkedIn.authorizationUrl)
  })

  router.post('/auth/linkedin/token', async ctx => {
    const { code } = ctx.request.body
    const user = await core.execute(SignInWithLinkedIn(code))
    const data = { user: { id: user.id } }
    const token = jwt.sign(data, secret)
    ctx.status = 200
    ctx.body = {
      token,
      user: data.user
    }
  })
}
