'use client'

import { useEffect, useState } from 'react'
import { FormRow } from '../components/FormRow'

type LangStr = { en: string; id: string }
type Category = { label: string; icon: string; color: string; href: string; order: number }
type Employer = { name: string; logo: string; href: string; verified?: boolean }

type LandingConfig = {
  locale: 'en' | 'id'
  seo: { title: string; description: string; keywords: string; ogImage: string; canonical?: string }
  hero: {
    headline: LangStr
    subheadline: LangStr
    media: { type: 'image' | 'video'; src: string; overlay: number }
    ctaPrimary: { label: LangStr; href: string }
    ctaSecondary?: { label: LangStr; href: string }
  }
  modules: {
    categories: Category[]
    featuredJobs: { mode: 'manual' | 'rule'; jobIds: number[]; limit: number; label: string }
    featuredEmployers: Employer[]
    banner?: { enabled: boolean; text: LangStr; href?: string; startAt?: string; endAt?: string }
    stats?: { jobs: number; companies: number; applicants: number }
  }
  flags: { showEmployers: boolean; showTestimonials: boolean }
}

const DRAFT_KEY = 'ark_landing_draft_v1'
const PUBLISHED_KEY = 'ark_landing_published_v1'

const DEFAULT_CONFIG: LandingConfig = {
  locale: 'en',
  seo: {
    title: 'Find Oil & Gas Jobs | ArkWork',
    description: 'Curated jobs in oil & gas, renewables and mining.',
    keywords: 'oil & gas jobs,HSE,drilling,LNG',
    ogImage: '/og/landing.png',
    canonical: 'https://arkwork.app/'
  },
  hero: {
    headline: { en: 'Build your energy career', id: 'Bangun karier energi Anda' },
    subheadline: { en: 'Jobs, tenders, & insights for professionals', id: 'Lowongan, tender, & insight' },
    media: { type: 'image', src: '/hero/rig.jpg', overlay: 0.35 },
    ctaPrimary: { label: { en: 'Browse Jobs', id: 'Cari Pekerjaan' }, href: '/jobs' },
    ctaSecondary: { label: { en: 'View Tenders', id: 'Lihat Tender' }, href: '/tender' }
  },
  modules: {
    categories: [
      { label: 'Drilling', icon: '⛏️', color: '#2563eb', href: '/jobs?function=Engineering', order: 1 },
      { label: 'HSE', icon: '🦺', color: '#f59e0b', href: '/jobs?q=HSE', order: 2 },
      { label: 'Operations', icon: '⚙️', color: '#10b981', href: '/jobs?function=Operations', order: 3 }
    ],
    featuredJobs: { mode: 'manual', jobIds: [7, 1, 3], limit: 6, label: 'Featured roles' },
    featuredEmployers: [
      { name: 'Pertamina', logo: '/logos/pertamina.svg', href: '/company/pertamina', verified: true },
      { name: 'SLB', logo: '/logos/slb.svg', href: '/company/slb', verified: true }
    ],
    banner: { enabled: true, text: { en: 'Graduate Program 2025 is open', id: 'Program Lulusan 2025 dibuka' }, href: '/campaigns/grad-2025' },
    stats: { jobs: 1287, companies: 214, applicants: 40231 }
  },
  flags: { showEmployers: true, showTestimonials: true }
}

export default function LandingAdminPage() {
  const [cfg, setCfg] = useState<LandingConfig>(DEFAULT_CONFIG)
  const [status, setStatus] = useState<string>('')

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY)
    setCfg(draft ? JSON.parse(draft) : DEFAULT_CONFIG)
  }, [])

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(cfg))
    setStatus('Draft saved ✓')
    setTimeout(() => setStatus(''), 1600)
  }

  function publish() {
    localStorage.setItem(PUBLISHED_KEY, JSON.stringify(cfg))
    setStatus('Published ✓')
    setTimeout(() => setStatus(''), 1600)
  }

  function loadPublished() {
    const pub = localStorage.getItem(PUBLISHED_KEY)
    if (pub) setCfg(JSON.parse(pub))
  }

  return (
    <div className="space-y-8">
      {/* Header actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Manage Landing Page</h2>
          <p className="text-sm text-neutral-600">Edit hero, categories, featured, banners, and SEO.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={loadPublished} className="rounded-xl border px-4 py-2 text-sm">Load Published</button>
          <button onClick={saveDraft} className="rounded-xl border px-4 py-2 text-sm">Save Draft</button>
          <button onClick={publish} className="rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm">Publish</button>
          <a href="/?preview=1" target="_blank" className="rounded-xl border px-4 py-2 text-sm">Preview</a>
        </div>
      </div>
      {!!status && <div className="text-sm text-emerald-700">{status}</div>}

      {/* Locale & SEO */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold mb-4">General & SEO</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <FormRow label="Locale">
            <select
              value={cfg.locale}
              onChange={(e)=>setCfg(s=>({ ...s, locale: e.target.value as 'en'|'id' }))}
              className="w-full rounded-xl border px-3 py-2"
            >
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
          </FormRow>
          <FormRow label="SEO Title">
            <input value={cfg.seo.title} onChange={(e)=>setCfg(s=>({ ...s, seo:{ ...s.seo, title:e.target.value }}))} className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
          <FormRow label="SEO Description">
            <input value={cfg.seo.description} onChange={(e)=>setCfg(s=>({ ...s, seo:{ ...s.seo, description:e.target.value }}))} className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
          <FormRow label="Keywords (comma separated)">
            <input value={cfg.seo.keywords} onChange={(e)=>setCfg(s=>({ ...s, seo:{ ...s.seo, keywords:e.target.value }}))} className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
          <FormRow label="OpenGraph Image URL">
            <input value={cfg.seo.ogImage} onChange={(e)=>setCfg(s=>({ ...s, seo:{ ...s.seo, ogImage:e.target.value }}))} className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
          <FormRow label="Canonical URL (opsional)">
            <input value={cfg.seo.canonical ?? ''} onChange={(e)=>setCfg(s=>({ ...s, seo:{ ...s.seo, canonical:e.target.value }}))} className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
        </div>
      </section>

      {/* Hero */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold mb-4">Hero</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <FormRow label="Headline (EN)">
            <input value={cfg.hero.headline.en} onChange={(e)=>setCfg(s=>({ ...s, hero:{ ...s.hero, headline:{ ...s.hero.headline, en:e.target.value }}}))} className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
          <FormRow label="Headline (ID)">
            <input value={cfg.hero.headline.id} onChange={(e)=>setCfg(s=>({ ...s, hero:{ ...s.hero, headline:{ ...s.hero.headline, id:e.target.value }}}))} className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
          <FormRow label="Subheadline (EN)">
            <input value={cfg.hero.subheadline.en} onChange={(e)=>setCfg(s=>({ ...s, hero:{ ...s.hero, subheadline:{ ...s.hero.subheadline, en:e.target.value }}}))} className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
          <FormRow label="Subheadline (ID)">
            <input value={cfg.hero.subheadline.id} onChange={(e)=>setCfg(s=>({ ...s, hero:{ ...s.hero, subheadline:{ ...s.hero.subheadline, id:e.target.value }}}))} className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
          <FormRow label="Media Type">
            <select
              value={cfg.hero.media.type}
              onChange={(e)=>setCfg(s=>({ ...s, hero:{ ...s.hero, media:{ ...s.hero.media, type:e.target.value as 'image'|'video' }}}))}
              className="w-full rounded-xl border px-3 py-2"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </FormRow>
          <FormRow label="Media URL">
            <input value={cfg.hero.media.src} onChange={(e)=>setCfg(s=>({ ...s, hero:{ ...s.hero, media:{ ...s.hero.media, src:e.target.value }}}))} className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
          <FormRow label="Overlay (0 - 0.8)">
            <input type="number" step="0.05" min={0} max={0.8} value={cfg.hero.media.overlay}
              onChange={(e)=>setCfg(s=>({ ...s, hero:{ ...s.hero, media:{ ...s.hero.media, overlay: Number(e.target.value) }}}))}
              className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
          <FormRow label="CTA Primary (EN)">
            <input value={cfg.hero.ctaPrimary.label.en} onChange={(e)=>setCfg(s=>({ ...s, hero:{ ...s.hero, ctaPrimary:{ ...s.hero.ctaPrimary, label:{ ...s.hero.ctaPrimary.label, en:e.target.value }}}}))} className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
          <FormRow label="CTA Primary Link">
            <input value={cfg.hero.ctaPrimary.href} onChange={(e)=>setCfg(s=>({ ...s, hero:{ ...s.hero, ctaPrimary:{ ...s.hero.ctaPrimary, href:e.target.value }}}))} className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
        </div>
      </section>

      {/* Categories */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Top Categories</h3>
          <button
            onClick={()=>setCfg(s=>({ ...s, modules:{ ...s.modules, categories:[...s.modules.categories, { label:'New', icon:'⭐', color:'#2563eb', href:'/jobs', order:(s.modules.categories.at(-1)?.order ?? 0)+1 }] }}))}
            className="rounded-xl border px-3 py-1.5 text-sm"
          >
            + Add
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {cfg.modules.categories.map((c, i)=>(
            <div key={i} className="rounded-xl border p-3">
              <div className="grid gap-3 md:grid-cols-2">
                <FormRow label="Label"><input value={c.label} onChange={(e)=>updateCat(i,{ label:e.target.value })} className="w-full rounded-xl border px-3 py-2"/></FormRow>
                <FormRow label="Icon / Emoji"><input value={c.icon} onChange={(e)=>updateCat(i,{ icon:e.target.value })} className="w-full rounded-xl border px-3 py-2"/></FormRow>
                <FormRow label="Color (hex)"><input value={c.color} onChange={(e)=>updateCat(i,{ color:e.target.value })} className="w-full rounded-xl border px-3 py-2"/></FormRow>
                <FormRow label="Link"><input value={c.href} onChange={(e)=>updateCat(i,{ href:e.target.value })} className="w-full rounded-xl border px-3 py-2"/></FormRow>
                <FormRow label="Order"><input type="number" value={c.order} onChange={(e)=>updateCat(i,{ order:Number(e.target.value) })} className="w-full rounded-xl border px-3 py-2"/></FormRow>
              </div>
              <div className="mt-3 flex justify-between">
                <button onClick={()=>moveCat(i,-1)} className="text-sm text-neutral-600">↑ Up</button>
                <button onClick={()=>moveCat(i,1)} className="text-sm text-neutral-600">↓ Down</button>
                <button onClick={()=>removeCat(i)} className="text-sm text-rose-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Jobs / Employers / Banner */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold mb-4">Featured & Banner</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <FormRow label="Featured Jobs Mode">
            <select
              value={cfg.modules.featuredJobs.mode}
              onChange={(e)=>setCfg(s=>({ ...s, modules:{ ...s.modules, featuredJobs:{ ...s.modules.featuredJobs, mode: e.target.value as 'manual'|'rule' }}}))}
              className="w-full rounded-xl border px-3 py-2"
            >
              <option value="manual">Manual (IDs)</option>
              <option value="rule">Rule-based (latest/popular)</option>
            </select>
          </FormRow>
          <FormRow label="Featured Jobs IDs (comma)">
            <input
              value={cfg.modules.featuredJobs.jobIds.join(',')}
              onChange={(e)=>setCfg(s=>({ ...s, modules:{ ...s.modules, featuredJobs:{ ...s.modules.featuredJobs, jobIds: e.target.value.split(',').map(x=>Number(x.trim())).filter(x=>!Number.isNaN(x)) }}}))}
              className="w-full rounded-xl border px-3 py-2"
            />
          </FormRow>
          <FormRow label="Featured Limit">
            <input type="number" value={cfg.modules.featuredJobs.limit}
              onChange={(e)=>setCfg(s=>({ ...s, modules:{ ...s.modules, featuredJobs:{ ...s.modules.featuredJobs, limit: Number(e.target.value) }}}))}
              className="w-full rounded-xl border px-3 py-2"
            />
          </FormRow>
          <FormRow label="Featured Label">
            <input value={cfg.modules.featuredJobs.label}
              onChange={(e)=>setCfg(s=>({ ...s, modules:{ ...s.modules, featuredJobs:{ ...s.modules.featuredJobs, label: e.target.value }}}))}
              className="w-full rounded-xl border px-3 py-2"
            />
          </FormRow>

          <FormRow label="Banner Enabled">
            <select
              value={String(cfg.modules.banner?.enabled ?? false)}
              onChange={(e)=>setCfg(s=>({
                ...s,
                modules:{ ...s.modules, banner:{ ...(s.modules.banner ?? { text:{ en:'', id:'' }}), enabled: e.target.value==='true' } }
              }))} className="w-full rounded-xl border px-3 py-2"
            >
              <option value="false">Off</option>
              <option value="true">On</option>
            </select>
          </FormRow>
          <FormRow label="Banner Text (EN)">
            <input value={cfg.modules.banner?.text.en ?? ''} onChange={(e)=>setCfg(s=>({
              ...s, modules:{ ...s.modules, banner:{ ...(s.modules.banner ?? { enabled:true, text:{ en:'', id:'' }}), text:{ ...(s.modules.banner?.text ?? { en:'', id:'' }), en:e.target.value } } }
            }))} className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
          <FormRow label="Banner Link">
            <input value={cfg.modules.banner?.href ?? ''} onChange={(e)=>setCfg(s=>({
              ...s, modules:{ ...s.modules, banner:{ ...(s.modules.banner ?? { enabled:true, text:{ en:'', id:'' }}), href:e.target.value } }
            }))} className="w-full rounded-xl border px-3 py-2"/>
          </FormRow>
        </div>
      </section>
    </div>
  )

  function updateCat(i: number, patch: Partial<Category>) {
    setCfg(s => {
      const next = [...s.modules.categories]
      next[i] = { ...next[i], ...patch }
      return { ...s, modules:{ ...s.modules, categories: next } }
    })
  }
  function moveCat(i:number, step:number) {
    setCfg(s=>{
      const next = [...s.modules.categories]
      const j = i + step
      if (j<0 || j>=next.length) return s
      const tmp = next[i]; next[i] = next[j]; next[j] = tmp
      return { ...s, modules:{ ...s.modules, categories: next } }
    })
  }
  function removeCat(i:number) {
    setCfg(s=>({ ...s, modules:{ ...s.modules, categories: s.modules.categories.filter((_,k)=>k!==i) }}))
  }
}
