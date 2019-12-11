import React from 'react'
import { useObservable } from 'rxjs-hooks'
import { map } from 'rxjs/operators'

import { core } from '../../core'
import imageSrc from '../../assets/img/SignInWithLinkedInButton.png'

export const SignInWithLinkedInButton: React.FC = () => {
  const alreadySignedIn = useObservable(() =>
    core.auth.store
      .pick('signedInUser')
      .pipe(map(({ signedInUser }) => !!signedInUser))
  )
  if (alreadySignedIn) return null
  return (
    <img
      src={imageSrc}
      alt="Sign in with LinkedIn"
      style={{ marginTop: 50, cursor: 'pointer' }}
      onClick={core.auth.providers.linkedIn.signIn}
    />
  )
}
