import axios from 'axios'

import { Route } from './Route'

const clientId = process.env.LINKEDIN_CLIENT_ID
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
const redirectUri = 'https://adapteach-web.herokuapp.com/auth/linkedin/callback'

export const authRoute: Route = router => {
  router.get('/auth/linkedin/callback', async ctx => {
    const { code } = ctx.query
    const url =
      'https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code' +
      '&client_id=' +
      clientId +
      '&client_secret=' +
      clientSecret +
      '&redirect_uri=' +
      redirectUri +
      '&code=' +
      code
    const response = await axios.get(url)
    ctx.status = 200
    ctx.body = response
  })
}
