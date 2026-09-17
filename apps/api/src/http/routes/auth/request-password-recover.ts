import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { type ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'

export async function requestPasswordRecover(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/password/recover',
      {
        schema: {
          tags: ['auth'],
          summary: 'Post password recover',
          body: z.object({
            email: z.email(),
          }),
          response: {
            201: z.void(),
          },
        },
      },
      async (request, reply) => {
        const { email } = request.body

        const userFromEmail = await prisma.user.findUnique({
          where: {
            email,
          },
        })

        if (!userFromEmail) {
          // We don´t want people to know if user really exists
          return reply.status(201).send()
        }

        const { id: code } = await prisma.token.create({
          data: {
            type: 'PASSWORD_RECOVER',
            userId: userFromEmail.id,
          },
        })

        // Send e-mail with password recover link

        console.log('recover password token', code)

        return reply.status(201).send()
      }
    )
}
