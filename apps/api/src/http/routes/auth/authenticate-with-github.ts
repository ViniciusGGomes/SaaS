import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { type ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { env } from '@saas/env'

export async function authenticateWithGithub(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/github',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate with github',
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

      /* 1. Troca o código pelo token de acesso no GITHUB */
      const githubOAuthURL = new URL(
        'https://github.com/login/oauth/access_token'
      )

      githubOAuthURL.searchParams.set('client_id', env.GITHUB_OAUTH_CLIENT_ID)
      githubOAuthURL.searchParams.set(
        'client_secret',
        env.GITHUB_OAUTH_CLIENT_SECRET
      )
      githubOAuthURL.searchParams.set(
        'redirect_uri',
        env.GITHUB_OAUTH_REDIRECT_URI
      )
      githubOAuthURL.searchParams.set('code', code)

      const githubAccessTokenResponse = await fetch(githubOAuthURL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      })

      const githubAccessTokenData = await githubAccessTokenResponse.json()

      const { access_token } = z
        .object({
          access_token: z.string(),
          token_type: z.literal('bearer'),
          scope: z.string(),
          expires_in: z.number().optional(),
          refresh_token: z.string().optional(),
          refresh_token_expires_in: z.number().optional(),
        })
        .parse(githubAccessTokenData)

      const githubUserResponse = await fetch('https://api.github.com/user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })

      const githubUserData = await githubUserResponse.json()

      const {
        id: githubId,
        avatar_url: avatarUrl,
        name,
        email,
      } = z
        .object({
          id: z.number().int().transform(String),
          avatar_url: z.string(),
          name: z.string().nullable(),
          email: z.string().nullable(),
        })
        .parse(githubUserData)

      let userEmail = email

      if (userEmail == null) {
        /* 2.1- Pegando o email principal do usuário */
        const githubEmailsResponse = await fetch(
          'https://api.github.com/user/emails',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        )

        const githubEmailsData = await githubEmailsResponse.json()

        const githubEmailsSchema = z.array(
          z.object({
            email: z.string(),
            primary: z.boolean(),
            verified: z.boolean(),
          })
        )
        const emails = githubEmailsSchema.parse(githubEmailsData)

        const primaryEmail = emails.find((e) => e.primary && e.verified)

        if (!primaryEmail) {
          throw new BadRequestError(
            'Your GitHub account must have a primary and verified email to authenticate.'
          )
        }

        userEmail = primaryEmail.email
      }

      /* 3. Persistência de Usuário */
      let user = await prisma.user.findUnique({
        where: {
          email: userEmail,
        },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: name ?? null,
            email: userEmail,
            avatarUrl: avatarUrl ?? null,
          },
        })
      }

      /* 4. Persistência de Conta do Provedor */
      let account = await prisma.account.findUnique({
        where: {
          provider_userId: {
            provider: 'GITHUB',
            userId: user.id,
          },
        },
      })

      if (!account) {
        account = await prisma.account.create({
          data: {
            provider: 'GITHUB',
            providerAccountId: githubId,
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
