'use server'

import { env } from '@saas/env'
import { redirect } from 'next/navigation'

export async function signInWithGoogle() {
  const googleSignInUrl = new URL(
    'https://accounts.google.com/o/oauth2/v2/auth'
  )

  googleSignInUrl.searchParams.set('client_id', env.GOOGLE_OAUTH_CLIENT_ID)

  googleSignInUrl.searchParams.set(
    'redirect_uri',
    env.GOOGLE_OAUTH_REDIRECT_URI
  )

  googleSignInUrl.searchParams.set('response_type', 'code')
  googleSignInUrl.searchParams.set('scope', 'openid profile email')
  googleSignInUrl.searchParams.set('access_type', 'offline')
  googleSignInUrl.searchParams.set('prompt', 'consent')

  redirect(googleSignInUrl.toString())
}
