// File: app/auth/page.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import Logo from '@/app/Images/Ungu__1_-removebg-preview.png'

/**
 * Unified Auth Page (Sign In / Sign Up)
 * - Google button REMOVED
 * - ArkWork description REMOVED
 * - Clean modern single-card design
 */
export default function AuthPage() {
  const tIn = useTranslations('signin')
  const tUp = useTranslations('signup')
  const router = useRouter()
  const { signin, signup } = useAuth()

  type Mode = 'signin' | 'signup'
  const [mode, setMode] = useState<Mode>('signin')

  // shared
  const [error, setError] = useState<string | null>(null)

  // signin
  const [siEmailOrUsername, setSiEmailOrUsername] = useState('')
  const [siPw, setSiPw] = useState('')
  const [siShow, setSiShow] = useState(false)
  const [siBusy, setSiBusy] = useState(false)

  // signup
  const [suName, setSuName] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPw, setSuPw] = useState('')
  const [suConfirm, setSuConfirm] = useState('')
  const [suShow, setSuShow] = useState(false)
  const [suShowC, setSuShowC] = useState(false)
  const [suAgree, setSuAgree] = useState(false)
  const [suBusy, setSuBusy] = useState(false)

  const suStrong =
    suPw.length >= 8 &&
    /[A-Z]/.test(suPw) &&
    /[a-z]/.test(suPw) &&
    /[0-9]/.test(suPw)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  // helper redirect sesuai role
  function redirectByRole(u: any) {
    const role =
      u?.role ?? u?.type ?? u?.user?.role

    if (role === 'admin') {
      router.push('/admin')
    } else if (role === 'employer') {
      router.push('/employer')
    } else {
      router.push('/dashboard')
    }

    // force re-render Nav & komponen yang baca session
    router.refresh()
  }

  async function onSignin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSiBusy(true)
    setError(null)
    try {
      const u = await signin(siEmailOrUsername.trim(), siPw)
      if (u) redirectByRole(u)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (err as { message?: string })?.message ||
        tIn('error.default')
      setError(msg)
    } finally {
      setSiBusy(false)
    }
  }

  async function onSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!suAgree) {
      setError(tUp('error.agree'))
      return
    }
    if (suPw !== suConfirm) {
      setError(tUp('error.mismatch'))
      return
    }
    setSuBusy(true)
    setError(null)
    try {
      const u = await signup(suName.trim(), suEmail.trim(), suPw)
      if (u) redirectByRole(u)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (err as { message?: string })?.message ||
        tUp('error.default')
      setError(msg)
    } finally {
      setSuBusy(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.08),transparent_60%)] from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[520px]">
        {/* Outer Card */}
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_10px_50px_rgba(2,6,23,0.08)] ring-1 ring-slate-100/60">
          {/* Decorative blur blobs */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />

          {/* Header */}
          <div className="px-8 pt-8 text-center">
            <Image
              src={Logo}
              alt="ArkWork Logo"
              width={96}
              height={96}
              className="mx-auto mb-5 h-20 w-20 object-contain drop-shadow-sm"
              priority
            />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {mode === 'signin' ? tIn('title') : tUp('title')}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {mode === 'signin' ? tIn('subtitle') : tUp('subtitle')}
            </p>

            {/* Tabs */}
            <div className="mt-6 inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 text-sm">
              <button
                onClick={() => switchMode('signin')}
                className={`px-4 py-1.5 rounded-xl transition ${
                  mode === 'signin'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-pressed={mode === 'signin'}
              >
                {tIn('form.signInBtn')}
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={`px-4 py-1.5 rounded-xl transition ${
                  mode === 'signup'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-pressed={mode === 'signup'}
              >
                {tUp('createBtn')}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mx-8 mt-5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Form container */}
          <div className="px-8 pb-8 pt-6">
            {mode === 'signin' ? (
              <form onSubmit={onSignin} noValidate className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">
                    Email / Username
                  </span>
                  <input
                    type="text"
                    value={siEmailOrUsername}
                    onChange={(e) => setSiEmailOrUsername(e.target.value)}
                    required
                    autoComplete="username email"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">
                    {tIn('form.password')}
                  </span>
                  <div className="relative">
                    <input
                      type={siShow ? 'text' : 'password'}
                      value={siPw}
                      onChange={(e) => setSiPw(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setSiShow((v) => !v)}
                      className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-slate-700"
                      tabIndex={-1}
                      aria-label={tIn('form.togglePw')}
                    >
                      {siShow ? '🙈' : '👁️'}
                    </button>
                  </div>
                </label>

                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                    {tIn('form.remember')}
                  </label>
                  <Link
                    className="text-sm font-medium text-blue-700 hover:underline"
                    href="/auth/forgot"
                  >
                    {tIn('form.forgot')}
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={siBusy}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {siBusy ? (
                    <>
                      <span className="mr-2 inline-block animate-spin">⏳</span>
                      {tIn('form.signingIn')}
                    </>
                  ) : (
                    tIn('form.signInBtn')
                  )}
                </button>

                <p className="mt-6 text-center text-sm text-slate-600">
                  {tIn('noAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {tIn('signUp')}
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={onSignup} noValidate className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">
                    {tUp('form.name')}
                  </span>
                  <input
                    value={suName}
                    onChange={(e) => setSuName(e.target.value)}
                    required
                    placeholder={tUp('placeholder.name')}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    autoComplete="name"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">
                    {tUp('form.email')}
                  </span>
                  <input
                    type="email"
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder={tUp('placeholder.email')}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">
                    {tUp('form.password')}
                  </span>
                  <div className="relative">
                    <input
                      type={suShow ? 'text' : 'password'}
                      value={suPw}
                      onChange={(e) => setSuPw(e.target.value)}
                      required
                      minLength={8}
                      placeholder={tUp('placeholder.password')}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setSuShow((v) => !v)}
                      className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-slate-700"
                      tabIndex={-1}
                      aria-label={tUp('form.togglePw')}
                    >
                      {suShow ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div
                    className="mt-1 flex items-center gap-2"
                    aria-hidden="true"
                  >
                    <div
                      className={`h-1 w-1/3 rounded ${
                        suPw.length >= 6 ? 'bg-amber-400' : 'bg-slate-200'
                      }`}
                    />
                    <div
                      className={`h-1 w-1/3 rounded ${
                        suPw.length >= 8 ? 'bg-amber-500' : 'bg-slate-200'
                      }`}
                    />
                    <div
                      className={`h-1 w-1/3 rounded ${
                        suStrong ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {tUp('password.hint')}
                  </p>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">
                    {tUp('form.confirm')}
                  </span>
                  <div className="relative">
                    <input
                      type={suShowC ? 'text' : 'password'}
                      value={suConfirm}
                      onChange={(e) => setSuConfirm(e.target.value)}
                      required
                      placeholder={tUp('placeholder.confirm')}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setSuShowC((v) => !v)}
                      className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-slate-700"
                      tabIndex={-1}
                      aria-label={tUp('form.toggleConfirm')}
                    >
                      {suShowC ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {suConfirm.length > 0 && (
                    <p
                      className={`mt-1 text-xs ${
                        suPw === suConfirm
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {suPw === suConfirm ? tUp('match.ok') : tUp('match.no')}
                    </p>
                  )}
                </label>

                <label className="mt-1 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={suAgree}
                    onChange={(e) => setSuAgree(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  {tUp('agree.1')}{' '}
                  <Link
                    href="/terms"
                    className="text-blue-700 hover:underline"
                  >
                    {tUp('agree.terms')}
                  </Link>{' '}
                  {tUp('agree.and')}{' '}
                  <Link
                    href="/privacy"
                    className="text-blue-700 hover:underline"
                  >
                    {tUp('agree.privacy')}
                  </Link>
                  .
                </label>

                <button
                  type="submit"
                  disabled={suBusy}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {suBusy ? (
                    <>
                      <span className="mr-2 inline-block animate-spin">⏳</span>
                      {tUp('creating')}
                    </>
                  ) : (
                    tUp('createBtn')
                  )}
                </button>

                <p className="mt-6 text-center text-sm text-slate-600">
                  {tUp('haveAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {tUp('signIn')}
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
