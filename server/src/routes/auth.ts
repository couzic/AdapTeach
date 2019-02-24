import axios from 'axios'

import { Route } from './Route'

const client_id = process.env.LINKEDIN_CLIENT_ID
const client_secret = process.env.LINKEDIN_CLIENT_SECRET
const redirect_uri =
  'https://adapteach-web.herokuapp.com/auth/linkedin/callback'

export const authRoute: Route = router => {
  router.get('/auth/linkedin/callback', async ctx => {
    const { code } = ctx.query
    const accessTokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken'
    const accessTokenRequestBody = {
      grant_type: 'authorization_code',
      client_id,
      client_secret,
      redirect_uri,
      code
    }
    console.log(accessTokenUrl, accessTokenRequestBody)
    const accessTokenResponse = await axios.post(
      accessTokenUrl,
      accessTokenRequestBody
    )
    const { access_token } = accessTokenResponse.data
    console.log({ access_token })

    // https://docs.microsoft.com/en-us/linkedin/shared/references/v2/profile/lite-profile
    const userProfileUrl = 'https://api.linkedin.com/v2/me'
    const apiResponse = await axios.get(userProfileUrl, {
      headers: {
        Authorization: 'Bearer ' + access_token
      }
    })

    ctx.status = 200
    ctx.body = {
      access_token,
      liteProfile: apiResponse.data
    }
  })
}
