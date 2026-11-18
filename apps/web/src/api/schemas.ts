import { z } from 'zod'
import { env } from '@/env'

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 72
const URL_MAX_LENGTH = 2048
const SLUG_MIN_LENGTH = 3
const SLUG_MAX_LENGTH = 32
const SLUG_PATTERN = /^[A-Za-z0-9_-]+$/
const SLUG_MESSAGE = `Use ${SLUG_MIN_LENGTH} to ${SLUG_MAX_LENGTH} letters, digits, "-" or "_"`
const PRODUCTION_HOST = 'snipsh-api.onrender.com'

const email = z.email('Enter a valid email address')

// Some browsers' URL parsers accept "https://not a url"; a space is never part of a real link.
function isHttpUrl(value: string) {
  return !/\s/.test(value) && URL.canParse(value) && /^https?:$/.test(new URL(value).protocol)
}

function isShortLink(value: string) {
  if (!URL.canParse(value)) return false
  const { host, hostname } = new URL(value)
  return (
    hostname === PRODUCTION_HOST ||
    hostname.endsWith(`.${PRODUCTION_HOST}`) ||
    host === new URL(env.shortDomain).host
  )
}

function isSlug(value: string) {
  return (
    value.length >= SLUG_MIN_LENGTH && value.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(value)
  )
}

export const urlSchema = z
  .string()
  .trim()
  .max(URL_MAX_LENGTH, `Keep the URL under ${URL_MAX_LENGTH} characters`)
  .refine(isHttpUrl, 'Enter a valid http:// or https:// URL')
  .refine((value) => !isShortLink(value), 'That is already a short link')

export const registerSchema = z.object({
  email,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters`),
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
})

// What the create form holds: the slug is always a string, and empty means "generate one".
export const createLinkFormSchema = z.object({
  url: urlSchema,
  slug: z
    .string()
    .trim()
    .refine((value) => value === '' || isSlug(value), SLUG_MESSAGE),
})

// What the API accepts: the slug may also be left out.
export const createLinkSchema = createLinkFormSchema.partial({ slug: true })

const REPORT_REASON_MAX_LENGTH = 500

// Accepts the slug or the whole short link a visitor copied, and keeps only the slug.
function toSlug(value: string) {
  const trimmed = value.trim()
  if (!URL.canParse(trimmed)) return trimmed
  return new URL(trimmed).pathname.replace(/^\/+|\/+$/g, '')
}

export const reportLinkSchema = z.object({
  slug: z.string().transform(toSlug).refine(isSlug, 'Enter the short link or its last part, like aB3x9'),
  reason: z
    .string()
    .trim()
    .min(1, 'Tell us what is wrong with the link')
    .max(REPORT_REASON_MAX_LENGTH, `Keep it under ${REPORT_REASON_MAX_LENGTH} characters`),
})

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Enter your password'),
})

export type Credentials = z.infer<typeof registerSchema>
export type ReportLinkForm = z.input<typeof reportLinkSchema>
export type ReportLinkInput = z.output<typeof reportLinkSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
export type CreateLinkInput = z.infer<typeof createLinkSchema>
