export const createAuthProviders = () => ({
  linkedIn: {
    signIn: () => {
      window.location.href = window.location.origin + '/auth/linkedin/signin'
    }
  }
})

export type AuthProviders = ReturnType<typeof createAuthProviders>
