import { auth } from '@/http/middlewares/auth'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { organizationSchema } from '@saas/auth'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { BadRequestError } from '../_errors/bad-request-error'

export async function transferOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/organizations/:slug/owner',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Transfer organization ownership',
          security: [{ bearerAuth: [] }],
          body: z.object({
            transferToUserId: z.uuid(),
          }),
          params: z.object({
            slug: z.string(),
          }),
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { slug } = request.params
        const { membership, organization } =
          await request.getUserMembership(slug)

        const { transferToUserId } = request.body

        /* 1- Verifico se o usuário tem permissão  */

        const authOrganization = organizationSchema.parse({
          id: organization.id,
          ownerId: organization.ownerId,
        })

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('transfer_ownership', authOrganization)) {
          throw new UnauthorizedError(
            "You're not allowed to transfer this organization ownership"
          )
        }

        /* 2- Verifico se o usuário que será transferido o owner faz parte da organização */

        const transferToMembership = await prisma.membership.findUnique({
          where: {
            organizationId_userId: {
              organizationId: organization.id,
              userId: transferToUserId,
            },
          },
        })

        if (!transferToMembership) {
          throw new BadRequestError(
            'Target user is not a member of this organization'
          )
        }

        /*3- Atualizo o member(role = admin) e a organização (ownerId) */

        await prisma.$transaction([
          prisma.membership.update({
            where: {
              organizationId_userId: {
                organizationId: organization.id,
                userId: transferToUserId,
              },
            },
            data: {
              role: 'ADMIN',
            },
          }),

          prisma.organization.update({
            where: {
              id: organization.id,
            },
            data: {
              ownerId: transferToUserId,
            },
          }),
        ])

        return reply.status(204).send()
      }
    )
}
