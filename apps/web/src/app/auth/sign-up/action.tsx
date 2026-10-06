'use server'

import { signUp } from '@/http/sign-up'
import { HTTPError } from 'ky'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const signUpSchema = z
  .object({
    name: z.string().refine((value) => value.split(' ').length > 1, {
      message: 'Please, enter your full name',
    }),
    email: z.email({ message: 'Please, provide a valid e-mail address' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' }),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Password confirmation does not match',
    path: ['password_confirmation'],
  })

type SignUpState = {
  success: boolean
  message: string | null
  errors: {
    name?: string[]
    email?: string[]
    password?: string[]
    password_confirmation?: string[]
  } | null
  payload: {
    name: string
    email: string
  }
}

export async function singUpAction(
  _: unknown,
  data: FormData
): Promise<SignUpState> {
  const formData = Object.fromEntries(data)

  const values = {
    name: String(formData.name ?? ''),
    email: String(formData.email ?? ''),
    password: String(formData.password ?? ''),
    password_confirmation: String(formData.password_confirmation ?? ''),
  }

  const result = signUpSchema.safeParse(values)

  if (!result.success) {
    const errors = z.flattenError(result.error).fieldErrors

    return {
      success: false,
      message: null,
      errors,
      payload: {
        name: values.name,
        email: values.email,
      },
    }
  }

  const { name, email, password } = result.data

  try {
    await signUp({
      name,
      email,
      password,
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
          name,
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
        name,
        email,
      },
    }
  }

  redirect('/auth/sign-in')
}
