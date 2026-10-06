import { api } from './api-client'

interface signInWithGoogleRequest {
  code: string
}

interface signInWithGoogleResponse {
  token: string
}

export function signInWithGoogle({ code }: signInWithGoogleRequest) {
  const result = api
    .post('/sessions/google', {
      json: {
        code,
      },
    })
    .json<signInWithGoogleResponse>()

  return result
}
