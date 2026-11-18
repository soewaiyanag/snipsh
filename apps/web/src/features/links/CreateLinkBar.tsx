import { zodResolver } from '@hookform/resolvers/zod'
import { CornerDownLeftIcon, LoaderCircleIcon } from 'lucide-react'
import { useEffect, useState, type KeyboardEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { HTTP_STATUS, isApiError } from '@/api/client'
import { createLinkFormSchema, urlSchema } from '@/api/schemas'
import type { Link } from '@/api/types'
import { Field } from '@/components/Field'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { SHORT_LINK_PREFIX } from '@/lib/short-link'
import { cn } from '@/lib/utils'
import { ShortResult } from './ShortResult'
import { useCreateLink } from './queries'

export const SLUG_TAKEN_MESSAGE = 'That slug is taken'

const STATUS_ID = 'create-url-status'
const PROTOCOL_HINT = 'https://'
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i
const MOD_KEY = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl'

// "example.com/page" is read as "https://example.com/page"; a typed scheme is kept and checked.
function withProtocol(value: string) {
  const trimmed = value.trim()
  return trimmed === '' || SCHEME_PATTERN.test(trimmed) ? trimmed : `${PROTOCOL_HINT}${trimmed}`
}

// While someone is still typing "http…", showing "https://" in front of it would read twice.
function isTypingScheme(value: string) {
  const lower = value.trim().toLowerCase()
  return SCHEME_PATTERN.test(lower) || 'https://'.startsWith(lower) || 'http://'.startsWith(lower)
}

const formSchema = createLinkFormSchema.extend({
  url: z.string().transform(withProtocol).pipe(urlSchema),
})

type Phase = 'idle' | 'validating' | 'ready' | 'shortening' | 'success' | 'error'
type StepState = 'pending' | 'current' | 'done' | 'failed'

const STEPS = ['validate', 'shorten', 'done'] as const

function stepStates(phase: Phase, failedAt: number): StepState[] {
  const doneUpTo = { idle: 0, validating: 0, ready: 1, shortening: 1, success: 3, error: failedAt }[phase]
  return STEPS.map((_, step) => {
    if (phase === 'error' && step === failedAt) return 'failed'
    if (step < doneUpTo) return 'done'
    if (step === doneUpTo && (phase === 'validating' || phase === 'shortening')) return 'current'
    return 'pending'
  })
}

type CreateLinkBarProps = { initialUrl?: string; onCreated?: (link: Link) => void }

export function CreateLinkBar({ initialUrl = '', onCreated }: CreateLinkBarProps) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const createLink = useCreateLink()
  const [showsSlug, setShowsSlug] = useState(false)
  const [madeLink, setMadeLink] = useState<Link | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    setFocus,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(formSchema), defaultValues: { url: initialUrl, slug: '' } })

  // ⌘K / Ctrl+K from anywhere on the page puts the cursor in the bar.
  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setFocus('url', { shouldSelect: true })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setFocus])

  function clear() {
    reset({ url: '', slug: '' })
    setMadeLink(null)
    setShowsSlug(false)
    setFocus('url')
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !isSubmitting) {
      event.preventDefault()
      clear()
    }
  }

  const submit = handleSubmit(async ({ url, slug }) => {
    // Nothing can be saved without an account: log in first, then land back here with the URL.
    if (!isAuthenticated) {
      const search = `?${new URLSearchParams({ url })}`
      await navigate('/login', { state: { from: { pathname: '/links', search, hash: '' } } })
      return
    }
    setMadeLink(null)
    try {
      const link = await createLink.mutateAsync({ url, slug: slug || undefined })
      reset({ url: '', slug: '' })
      setShowsSlug(false)
      setMadeLink(link)
      onCreated?.(link)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      if (isApiError(error, HTTP_STATUS.conflict)) {
        setShowsSlug(true)
        // The API words "reserved" differently from "taken"; both belong under the slug field.
        setError('slug', { message: /reserved/i.test(message) ? message : SLUG_TAKEN_MESSAGE })
        return
      }
      // Custom slugs are a paid feature: that refusal belongs under the slug field too.
      if (isApiError(error, HTTP_STATUS.forbidden) && slug && /slug/i.test(message)) {
        setError('slug', { message })
        return
      }
      setError('root', { message })
    }
  })

  const rawUrl = useWatch({ control, name: 'url' })
  const urlCheck = formSchema.shape.url.safeParse(rawUrl)
  const failure = errors.url?.message ?? errors.slug?.message ?? errors.root?.message
  const phase: Phase = isSubmitting
    ? 'shortening'
    : failure
      ? 'error'
      : rawUrl.trim() === ''
        ? madeLink
          ? 'success'
          : 'idle'
        : urlCheck.success
          ? 'ready'
          : 'validating'
  const failedAt = errors.url ? 0 : 1
  const showsProtocol = rawUrl !== '' && !isTypingScheme(rawUrl)

  const status = {
    idle: 'Any http or https link',
    validating: urlCheck.error?.issues[0]?.message,
    ready: isAuthenticated ? 'Looks good. Press Enter to shorten.' : 'Looks good. Log in to save it.',
    shortening: 'Shortening…',
    success: 'Short link ready',
    error: errors.url?.message ?? errors.root?.message ?? 'Check the slug below',
  }[phase]

  return (
    <div onKeyDown={onKeyDown} className="grid gap-3">
      <form onSubmit={submit} noValidate className="grid gap-2.5">
        <fieldset disabled={isSubmitting} className="contents">
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl border border-input bg-card p-1.5 pl-4 transition-[border-color,box-shadow] duration-200 hover:border-foreground/30 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring',
              phase === 'error' && errors.url && 'border-destructive focus-within:border-destructive focus-within:ring-destructive',
              phase === 'shortening' && 'border-sweep',
            )}
          >
            <label htmlFor="create-url" className="sr-only">
              Long URL
            </label>
            <span className="link-text flex min-w-0 flex-1 items-center text-base">
              {showsProtocol && (
                <span aria-hidden className="shrink-0 animate-in text-subtle duration-200 fade-in-0">
                  {PROTOCOL_HINT}
                </span>
              )}
              <input
                id="create-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                autoFocus={initialUrl !== ''}
                spellCheck={false}
                placeholder="Paste a long URL"
                aria-invalid={errors.url ? true : undefined}
                aria-describedby={STATUS_ID}
                className="h-11 min-w-0 flex-1 bg-transparent outline-none placeholder:font-sans placeholder:text-subtle disabled:opacity-60"
                {...register('url', { onChange: () => clearErrors('root') })}
              />
            </span>
            {phase === 'idle' && (
              <kbd aria-hidden className="kbd hidden pointer-fine:inline-flex">
                {MOD_KEY} K
              </kbd>
            )}
            <Button type="submit" size="lg" className="h-11 shrink-0 rounded-lg px-4 sm:h-10">
              {isSubmitting ? <LoaderCircleIcon className="animate-spin" /> : null}
              Shorten
              {!isSubmitting && (
                <CornerDownLeftIcon aria-hidden className="hidden opacity-50 pointer-fine:block" />
              )}
            </Button>
          </div>

          <div className="flex min-h-5 items-center justify-between gap-4 px-1 font-mono text-xs">
            <p
              id={STATUS_ID}
              role={phase === 'error' ? 'alert' : 'status'}
              className={cn(
                'min-w-0 truncate',
                phase === 'error' ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {status}
            </p>
            <PipelineSteps states={stepStates(phase, failedAt)} />
          </div>

          {showsSlug ? (
            <Field
              label="Slug (optional)"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              prefix={SHORT_LINK_PREFIX}
              placeholder="made for you if empty"
              inputClassName="link-text"
              className="mt-1 w-full max-w-md animate-spring-in"
              error={errors.slug?.message}
              {...register('slug')}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowsSlug(true)}
              className="w-fit rounded-sm px-1 text-sm text-muted-foreground underline decoration-border underline-offset-4 outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
            >
              Choose your own slug
            </button>
          )}
        </fieldset>
      </form>

      {madeLink && <ShortResult key={madeLink.id} link={madeLink} />}
    </div>
  )
}

const STEP_STYLES: Record<StepState, string> = {
  pending: 'text-subtle',
  current: 'text-foreground',
  done: 'text-muted-foreground',
  failed: 'text-destructive',
}

const DOT_STYLES: Record<StepState, string> = {
  pending: 'border border-subtle',
  current: 'bg-foreground animate-pulse',
  done: 'bg-muted-foreground',
  failed: 'bg-destructive',
}

function PipelineSteps({ states }: { states: StepState[] }) {
  return (
    <ol aria-label="Progress" className="hidden shrink-0 items-center gap-3 sm:flex">
      {STEPS.map((step, index) => (
        <li
          key={step}
          className={cn('flex items-center gap-1.5 transition-colors duration-300', STEP_STYLES[states[index]])}
        >
          <span
            aria-hidden
            className={cn('size-1.5 rounded-full transition-colors duration-300', DOT_STYLES[states[index]])}
          />
          {step}
          <span className="sr-only">: {states[index]}</span>
        </li>
      ))}
    </ol>
  )
}
