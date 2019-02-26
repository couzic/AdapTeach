import 'mocha'

import { expect } from 'chai'

import {
  extractLinkedInProfile,
  RawLinkedInUserProfile
} from './extractLinkedInProfile'

describe('extractLinkedInUserNames', () => {
  describe('when extracting from typical profile', () => {
    const typicalProfile: RawLinkedInUserProfile = {
      id: 'LinkedInUserId',
      firstName: {
        localized: {
          en_US: 'Mikael'
        },
        preferredLocale: {
          country: 'US',
          language: 'en'
        }
      },
      lastName: {
        localized: {
          en_US: 'Couzic'
        },
        preferredLocale: {
          country: 'US',
          language: 'en'
        }
      },
      profilePicture: {
        displayImage: 'displayImage'
      }
    }
    const extracted = extractLinkedInProfile(typicalProfile)
    it('extracts id', () => {
      expect(extracted.id).to.equal(typicalProfile.id)
    })
    it('extracts first name', () => {
      expect(extracted.firstName).to.equal(
        typicalProfile.firstName.localized.en_US
      )
    })
    it('extracts last name', () => {
      expect(extracted.lastName).to.equal(
        typicalProfile.lastName.localized.en_US
      )
    })
  })
})
