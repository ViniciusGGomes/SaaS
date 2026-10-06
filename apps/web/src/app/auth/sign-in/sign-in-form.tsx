'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'

import Image from 'next/image'
import Link from 'next/link'
import { useActionState } from 'react'

import githubIcon from '@/assets/github-icon.svg'
import googleIcon from '@/assets/google-icon.svg'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

import { singInWithEmailAndPassword } from './action'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { signInWithGithub } from '../action-github'
import { signInWithGoogle } from '../action-google'

export function SignInForm() {
  const [{ errors, success, message, payload }, formAction, isPending] =
    useActionState(singInWithEmailAndPassword, {
      success: false,
      message: null,
      errors: null,
      payload: { email: '' },
    })

  return (
    <form action={formAction} className="space-y-4 ">
      {success === false && message && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Sign in failed!</AlertTitle>
          <AlertDescription>
            <p>{message}</p>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1 ">
        <Label htmlFor="email">E-mail</Label>
        <Input
          name="email"
          type="email"
          id="email"
          defaultValue={payload.email}
          className="h-10 rounded-md text-sm"
        />

        {errors?.email && (
          <p className="text-xs font-medium text-red-500 dark:text-red-500">
            {errors.email[0]}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input
          name="password"
          type="password"
          id="password"
          className="h-10 rounded-md text-sm"
        />

        {errors?.password && (
          <p className="text-xs font-medium text-red-500 dark:text-red-500">
            {errors.password[0]}
          </p>
        )}
      </div>

      <Link
        href="/auth/forgot-password"
        className="text-foreground text-xs font-medium hover:underline"
      >
        Forgot your password?
      </Link>

      <Button type="submit" className="h-10 w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          'Sing in with e-mail'
        )}
      </Button>

      <Button variant="link" className="h-10 w-full" size="sm">
        <Link href="/auth/sign-up">Create new account</Link>
      </Button>

      <Separator />

      <Button
        type="submit"
        formAction={signInWithGithub}
        variant="outline"
        className="h-10 w-full bg-transparent"
      >
        <Image src={githubIcon} className="mr-2 size-4 dark:invert" alt="" />
        Sing in with Github
      </Button>

      <Button
        type="submit"
        formAction={signInWithGoogle}
        variant="outline"
        className="h-10 w-full bg-transparent"
      >
        <Image src={googleIcon} className="mr-2 size-4 dark:invert" alt="" />
        Sing in with Google
      </Button>
    </form>
  )
}
