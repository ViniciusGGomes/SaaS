import { cookies } from 'next/headers'
import { api } from './api-client'

interface CreateOrganizationRequest {
  name: string
  domain: string | null
  shouldAttachUsersByDomain: boolean
}

interface CreateOrganizationResponse {
  organizationId: string
}

export async function createOrganization({
  name,
  domain,
  shouldAttachUsersByDomain,
}: CreateOrganizationRequest) {
  const token = (await cookies()).get('token')?.value

  const result = await api
    .post('organization', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      json: {
        name,
        domain,
        shouldAttachUsersByDomain,
      },
    })
    .json<CreateOrganizationResponse>()

  return result
}
