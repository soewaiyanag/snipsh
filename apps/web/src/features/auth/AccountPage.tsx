import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { deleteAccount } from '@/api/auth'
import { HTTP_STATUS, isApiError } from '@/api/client'
import { deleteAccountSchema, type DeleteAccountInput } from '@/api/schemas'
import { Field } from '@/components/Field'
import { Button } from '@/components/ui/button'
import { useAuth } from './auth-context'
import { clearToken } from './token'

export function AccountPage() {
  const { email } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '' },
  })

  const submit = handleSubmit(async (input) => {
    try {
      await deleteAccount(input)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      // A 401 here means a wrong password, so it stays on the form instead of signing out.
      setError(isApiError(error, HTTP_STATUS.unauthorized) ? 'password' : 'root', { message })
      return
    }
    // Leave the protected page first, like logging out, then forget everything we cached.
    await navigate('/')
    clearToken()
    queryClient.clear()
    toast.success('Your account is deleted', { description: 'Your links and their clicks are gone too.' })
  })

  return (
    <section className="mx-auto w-full max-w-lg pt-6 sm:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
      <p className="mt-1.5 text-muted-foreground">
        Signed in as <span className="text-foreground">{email}</span>
      </p>

      <form
        onSubmit={submit}
        noValidate
        className="mt-10 grid gap-4 rounded-xl border border-destructive/40 p-5"
      >
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Delete account</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This deletes your account, every link you made and all their clicks. It cannot be undone,
            and your short links stop working right away.
          </p>
        </div>
        {errors.root && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {errors.root.message}
          </p>
        )}
        <Field
          label="Your password"
          type="password"
          autoComplete="current-password"
          hint="We ask again, so nobody else at this screen can do it."
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          {isSubmitting ? 'Deleting...' : 'Delete my account'}
        </Button>
      </form>
    </section>
  )
}
