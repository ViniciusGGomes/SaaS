import { api } from './api-client'

interface signInWithGithubRequest {
  code: string
}

interface signInWithGithubResponse {
  token: string
}

export function signInWithGithub({ code }: signInWithGithubRequest) {
  const result = api
    .post('/sessions/github', {
      json: {
        code,
      },
    })
    .json<signInWithGithubResponse>()

  return result
}
