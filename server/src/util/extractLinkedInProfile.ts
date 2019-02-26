import {
  LinkedInUserId,
  LinkedInUserProfile
} from '../core/ports/LinkedInGateway'

export interface RawLinkedInUserProfile {
  id: LinkedInUserId
  firstName: {
    localized: Record<string, string>
    preferredLocale: {
      country: string
      language: string
    }
  }
  lastName: {
    localized: Record<string, string>
    preferredLocale: {
      country: string
      language: string
    }
  }
  profilePicture: {
    displayImage: string
  }
}

export const extractLinkedInProfile = (
  rawProfile: RawLinkedInUserProfile
): LinkedInUserProfile => {
  const { id } = rawProfile

  const firstNameLocale = rawProfile.firstName.preferredLocale
  const firstName =
    rawProfile.firstName.localized[
      firstNameLocale.language + '_' + firstNameLocale.country
    ]

  const lastNameLocal = rawProfile.lastName.preferredLocale
  const lastName =
    rawProfile.lastName.localized[
      lastNameLocal.language + '_' + lastNameLocal.country
    ]
  return { id, firstName, lastName }
}
