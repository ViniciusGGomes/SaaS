import { Role } from '@saas/auth/src/role'
import { api } from './api-client'
import { cookies } from 'next/headers'

interface GetMemberShipResponse {
  membership: {
    id: string
    role: Role
    userId: string
    organizationId: string
  }
}

export async function getMembership(slug: string) {
  const token = (await cookies()).get('token')?.value

  const result = await api(`/organizations/${slug}/membership`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).json<GetMemberShipResponse>()

  return result
}
