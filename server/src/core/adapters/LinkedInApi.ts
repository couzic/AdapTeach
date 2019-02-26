import axios from 'axios'
import querystring from 'querystring'

import {
  extractLinkedInProfile,
  RawLinkedInUserProfile
} from '../../util/extractLinkedInProfile'
import { LinkedInGateway } from '../ports/LinkedInGateway'

const client_id = process.env.LINKEDIN_CLIENT_ID
const client_secret = process.env.LINKEDIN_CLIENT_SECRET
const callbackPath = '/auth/linkedin/callback'
const redirect_uri = process.env.BASE_URL + callbackPath
const scope = ['r_liteprofile', 'r_emailaddress'].join(' ')
const authorizationUrl =
  'https://www.linkedin.com/oauth/v2/authorization?response_type=code' +
  `&client_id=${client_id}` +
  `&redirect_uri=${redirect_uri}` +
  `&scope=${scope}`

const accessTokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken'
const accessTokenRequestHeaders = {
  'Content-Type': 'application/x-www-form-urlencoded'
}

export const createLinkedInApi = (): LinkedInGateway => ({
  authorizationUrl,
  callbackPath,
  getAccessToken: async (authorizationCode: string) => {
    // stringify because x-www-form-urlencoded
    const accessTokenRequestBody = querystring.stringify({
      grant_type: 'authorization_code',
      client_id,
      client_secret,
      redirect_uri,
      code: authorizationCode
    })
    const accessTokenResponse = await axios.post(
      accessTokenUrl,
      accessTokenRequestBody,
      { headers: accessTokenRequestHeaders }
    )
    return { token: accessTokenResponse.data.access_token }
  },
  getUserProfile: async (token: string) => {
    // https://docs.microsoft.com/en-us/linkedin/shared/references/v2/profile/lite-profile
    const userProfileUrl = 'https://api.linkedin.com/v2/me'
    const apiResponse = await axios.get(userProfileUrl, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
    const rawProfile: RawLinkedInUserProfile = apiResponse.data
    const profile = extractLinkedInProfile(rawProfile)
    return profile
  }
})
