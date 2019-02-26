export interface LinkedInGateway {
  readonly authorizationUrl: string
  readonly callbackPath: string
  getAccessToken: (authorizationCode: string) => Promise<{ token: string }>
  getUserProfile: (token: string) => Promise<LinkedInUserProfile>
}

export interface LinkedInUserProfile {
  id: LinkedInUserId
  firstName: string
  lastName: string
}

export type LinkedInUserId = 'LinkedInUserId'
