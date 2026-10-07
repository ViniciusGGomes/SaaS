import { cookies } from 'next/headers'
import { api } from './api-client'

interface GetOrganizationsResponse {
  organizations: {
    slug: string
    id: string
    name: string
    avatarUrl: string | null
  }[]
}

export async function getOrganizations() {
  const token = (await cookies()).get('token')?.value

  const result = await api('organizations', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).json<GetOrganizationsResponse>()

  return result
}
