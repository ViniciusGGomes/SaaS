'use server'

import { signInWithPassword } from '@/http/sign-in-with-password'
import { HTTPError } from 'ky'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const signInSchema = z.object({
  email: z.email({ message: 'Please, provide a valid e-mail address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' }),
})

type SignInState = {
  success: boolean
  message: string | null
  errors: {
    email?: string[]
    password?: string[]
  } | null
  payload: {
    email: string
  }
}

export async function singInWithEmailAndPassword(
  _: unknown,
  data: FormData
): Promise<SignInState> {
  const formData = Object.fromEntries(data)

  const values = {
    email: String(formData.email ?? ''),
    password: String(formData.password ?? ''),
  }

  const result = signInSchema.safeParse(values)

  if (!result.success) {
    const errors = z.flattenError(result.error).fieldErrors

    return {
      success: false,
      message: null,
      errors,
      payload: {
        email: values.email,
      },
    }
  }

  const { email, password } = result.data

  try {
    const { token } = await signInWithPassword({
      email,
      password,
    })

    const cookieStore = await cookies()

    cookieStore.set('token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  } catch (error) {
    if (error instanceof HTTPError) {
      const { message } = error.data as {
        message: string
      }

      return {
        success: false,
        message,
        errors: null,
        payload: {
          email,
        },
      }
    }

    console.error(error)

    return {
      success: false,
      message: 'Unexpected error, try again in a few minutes.',
      errors: null,
      payload: {
        email,
      },
    }
  }

  redirect('/')
}
