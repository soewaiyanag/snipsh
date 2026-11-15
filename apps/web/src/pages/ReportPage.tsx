import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router'
import { HTTP_STATUS, isApiError } from '@/api/client'
import { reportLink } from '@/api/links'
import { reportLinkSchema, type ReportLinkForm, type ReportLinkInput } from '@/api/schemas'
import { Field } from '@/components/Field'
import { Button } from '@/components/ui/button'
import { SHORT_LINK_PREFIX } from '@/lib/short-link'

export function ReportPage() {
  const [searchParams] = useSearchParams()
  const [reportedSlug, setReportedSlug] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReportLinkForm, unknown, ReportLinkInput>({
    resolver: zodResolver(reportLinkSchema),
    // /report?slug=aB3x9 fills the field, so a "report this link" button elsewhere can link here.
    defaultValues: { slug: searchParams.get('slug') ?? '', reason: '' },
  })

  const submit = handleSubmit(async (input) => {
    try {
      await reportLink(input)
      setReportedSlug(input.slug)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      setError(isApiError(error, HTTP_STATUS.notFound) ? 'slug' : 'root', {
        message: isApiError(error, HTTP_STATUS.notFound) ? 'There is no short link with that name' : message,
      })
    }
  })

  if (reportedSlug) {
    return (
      <section className="mx-auto w-full max-w-sm pt-6 sm:pt-16">
        <h1 className="text-3xl font-semibold tracking-tight">Thanks, we got it</h1>
        <p className="mt-2 text-muted-foreground">
          We will look at <span className="link-text text-foreground">{SHORT_LINK_PREFIX}{reportedSlug}</span>{' '}
          and switch it off if it is harmful.
        </p>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-sm pt-6 sm:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight">Report a link</h1>
      <p className="mt-1.5 text-muted-foreground">
        Did a snipsh link take you somewhere harmful, like a scam or malware? Tell us and we will review it.
      </p>

      <form onSubmit={submit} noValidate className="sheet mt-6 grid gap-4 p-5">
        {errors.root && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {errors.root.message}
          </p>
        )}
        <Field
          label="Short link"
          placeholder={`${SHORT_LINK_PREFIX}aB3x9`}
          autoComplete="off"
          error={errors.slug?.message}
          {...register('slug')}
        />
        <Field
          label="What is wrong with it?"
          placeholder="It pretends to be my bank's login page"
          autoComplete="off"
          error={errors.reason?.message}
          {...register('reason')}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending report...' : 'Send report'}
        </Button>
      </form>
    </section>
  )
}
