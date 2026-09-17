import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { type ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { env } from '@saas/env'

export async function authenticateWithGoogle(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/google',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate with google',
        body: z.object({
          code: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { code } = request.body

      // Decodifica %2F para / antes de enviar ao Google
      const decodedCode = decodeURIComponent(code)

      /* 1. Troca o código pelo token de acesso no Google */
      const googleOAuthURL = new URL('https://oauth2.googleapis.com/token')

      googleOAuthURL.searchParams.set('client_id', env.GOOGLE_OAUTH_CLIENT_ID)
      googleOAuthURL.searchParams.set(
        'client_secret',
        env.GOOGLE_OAUTH_CLIENT_SECRET
      )
      googleOAuthURL.searchParams.set(
        'redirect_uri',
        env.GOOGLE_OAUTH_REDIRECT_URI
      )
      googleOAuthURL.searchParams.set('grant_type', 'authorization_code')
      googleOAuthURL.searchParams.set('code', decodedCode)

      const googleAccessTokenResponse = await fetch(googleOAuthURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const googleAccessTokenData = await googleAccessTokenResponse.json()

      const { access_token } = z
        .object({
          access_token: z.string(),
          token_type: z.literal('Bearer'),
          expires_in: z.number().optional(),
          scope: z.string().optional(),
          id_token: z.string().optional(),
        })
        .parse(googleAccessTokenData)

      /* 2. Busca o perfil do usuário na API do Google */
      const googleUserResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )

      const googleUserData = await googleUserResponse.json()

      const {
        id: googleId,
        picture: avatarUrl,
        name,
        email,
        verified_email: verifiedEmail,
      } = z
        .object({
          id: z.string(),
          picture: z.string().nullable().optional(),
          name: z.string().nullable().optional(),
          email: z.string(),
          verified_email: z.boolean().default(false),
        })
        .parse(googleUserData)

      if (!verifiedEmail) {
        throw new BadRequestError(
          'Your Google account must have a verified email to authenticate.'
        )
      }

      /* 3. Persistência de Usuário */
      let user = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: name ?? null,
            email,
            avatarUrl: avatarUrl ?? null,
          },
        })
      }

      /* 4. Persistência de Conta do Provedor */
      let account = await prisma.account.findUnique({
        where: {
          provider_userId: {
            provider: 'GOOGLE',
            userId: user.id,
          },
        },
      })

      if (!account) {
        account = await prisma.account.create({
          data: {
            provider: 'GOOGLE',
            providerAccountId: googleId,
            userId: user.id,
          },
        })
      }

      /* 5. Emissão do JWT */
      const token = await reply.jwtSign(
        {
          sub: user.id,
        },
        {
          sign: {
            expiresIn: '7d',
          },
        }
      )

      return reply.status(201).send({ token })
    }
  )
}
