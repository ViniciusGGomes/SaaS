'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'

import Image from 'next/image'
import { useActionState } from 'react'

import githubIcon from '@/assets/github-icon.svg'
import googleIcon from '@/assets/google-icon.svg'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

import { singUpAction } from './action'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { signInWithGithub } from '../action-github'
import { signInWithGoogle } from '../action-google'

export function SignUpForm() {
  const [{ errors, success, message, payload }, formAction, isPending] =
    useActionState(singUpAction, {
      success: false,
      message: null,
      errors: null,
      payload: { name: '', email: '' },
    })

  return (
    <form action={formAction} className="space-y-4 ">
      {success === false && message && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Sign up failed!</AlertTitle>
          <AlertDescription>
            <p>{message}</p>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1 ">
        <Label htmlFor="name">Name</Label>
        <Input
          name="name"
          type="name"
          id="name"
          defaultValue={payload.name}
          className="h-10 rounded-md text-sm"
        />

        {errors?.name && (
          <p className="text-xs font-medium text-red-500 dark:text-red-500">
            {errors.name[0]}
          </p>
        )}
      </div>

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

      <div className="space-y-1">
        <Label htmlFor="password_confirmation">Confirm your password</Label>
        <Input
          name="password_confirmation"
          type="password"
          id="password_confirmation"
          className="h-10 rounded-md text-sm"
        />

        {errors?.password_confirmation && (
          <p className="text-xs font-medium text-red-500 dark:text-red-500">
            {errors.password_confirmation[0]}
          </p>
        )}
      </div>

      <Button type="submit" className="h-10 w-full" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Sing up'}
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
