import { cookies } from 'next/headers'
import { api } from './api-client'

interface GetProfileResponse {
  user: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  }
}

export async function getProfile() {
  const token = (await cookies()).get('token')?.value

  const result = await api
    .get('profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .json<GetProfileResponse>()

  return result
}
