import { auth } from '@/http/middlewares/auth'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { BadRequestError } from '../_errors/bad-request-error'

export async function updateMember(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/members/:memberId',
      {
        schema: {
          tags: ['Members'],
          summary: 'Update a member',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            memberId: z.uuid(),
          }),
          body: z.object({
            role: z.enum(Role),
          }),
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { slug, memberId } = request.params
        const { membership, organization } =
          await request.getUserMembership(slug)

        const { role } = request.body

        const member = await prisma.membership.findFirst({
          where: {
            userId: memberId,
            organizationId: organization.id,
          },
        })

        if (!member) {
          throw new BadRequestError('Member not found')
        }

        const { cannot } = getUserPermissions(userId, membership.role)
        if (cannot('update', 'User')) {
          throw new UnauthorizedError(
            "You're not allowed to update this member"
          )
        }

        await prisma.membership.update({
          where: {
            id: member.id,
            organizationId: organization.id,
          },
          data: {
            role,
          },
        })

        return reply.status(204).send()
      }
    )
}
