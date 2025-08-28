'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* ===================== Types ===================== */
type Msg = { id: string; role: 'user' | 'assistant'; text: string; ts: number };
type Profile = {
  name?: string;
  role?: string;
  skills?: string;
  location?: string;
  experienceYears?: number;
  interests?: string;
};

/* ===================== Consts ===================== */
const STORAGE_KEY = 'ogm-chat-history-v1';
const PROFILE_KEY = 'ogm-chat-profile-v1';
const DEFAULT_CHAT_API =
  (process.env.NEXT_PUBLIC_API_BASE
    ? `${process.env.NEXT_PUBLIC_API_BASE}/api/chat`
    : '/api/chat');

/* ===================== Utils ===================== */
function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function rid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ==================================================
   Component
   ================================================== */
export default function ChatbotWidget({ chatApi = DEFAULT_CHAT_API }: { chatApi?: string }) {
  const pathname = usePathname();

  // --- HIDE ON /admin ---
  const hideOnThisPage = useMemo(() => {
    if (!pathname) return false;
    const segs = pathname.split('?')[0].split('#')[0].split('/').filter(Boolean);
    return segs.includes('admin');
  }, [pathname]);
  if (hideOnThisPage) return null;

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [profile, setProfile] = useState<Profile>({});
  const [showProfile, setShowProfile] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  /* ---------- load history & profile ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMsgs(JSON.parse(raw));
      const p = localStorage.getItem(PROFILE_KEY);
      if (p) setProfile(JSON.parse(p));
    } catch {}
  }, []);

  /* ---------- save history & profile ---------- */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    } catch {}
  }, [msgs]);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  /* ---------- auto scroll ---------- */
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs, open, busy]);

  /* ---------- prompt suggestions (gabungan) ---------- */
  const suggestions = useMemo(
    () => [
      // News
      'Ringkas berita migas hari ini',
      'Berita LNG Indonesia terbaru',
      // Jobs (jobseeker)
      'Rekomendasikan role migas untuk operator kilang 2 tahun di Balikpapan',
      'Skill apa agar masuk tim HSE di LNG?',
      // Consult
      'Saya ingin pindah dari operator ke planner—langkahnya?',
      'Bikin roadmap 90 hari belajar analytics produksi',
      // Employer
      'Bikinkan JD Production Engineer (mid, Jakarta) + scorecard',
      'Susun alur rekrutmen 3 tahap + SLA & email template',
    ],
    []
  );

  /* ---------- ask API ---------- */
  async function ask(text: string) {
    if (!text.trim() || busy) return;
    const u: Msg = { id: rid(), role: 'user', text: text.trim(), ts: Date.now() };
    setMsgs((m) => [...m, u]);
    setInput('');
    setBusy(true);

    try {
      const res = await fetch(chatApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Tidak kirim intent: backend akan auto-infer
          profile,
          messages: [
            ...msgs.map(({ role, text }) => ({ role, content: text })),
            { role: 'user', content: text.trim() },
          ],
        }),
      });

      let reply = '⚠️ Server tidak mengembalikan jawaban.';
      try {
        const data = await res.json();
        reply = (res.ok && (data.answer || data.message)) || reply;
      } catch {}

      const a: Msg = { id: rid(), role: 'assistant', text: reply, ts: Date.now() };
      setMsgs((m) => [...m, a]);
    } catch {
      const a: Msg = {
        id: rid(),
        role: 'assistant',
        text: '⚠️ Gagal terhubung ke ArkWork Agent.',
        ts: Date.now(),
      };
      setMsgs((m) => [...m, a]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    ask(input);
  }

  /* ---------- reset chat ---------- */
  function resetChat() {
    setMsgs([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  /* ===================== UI ===================== */
  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Buka ArkWork Agent"
        className="fixed bottom-5 right-5 z-50 rounded-full h-14 w-14 shadow-lg border border-neutral-200 bg-black text-white hover:scale-105 transition grid place-items-center"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7">
          <path d="M12 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="4" y="6" width="16" height="12" rx="4" ry="4" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="9" cy="12" r="1.5" fill="currentColor" />
          <circle cx="15" cy="12" r="1.5" fill="currentColor" />
          <path d="M8 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[min(92vw,380px)] rounded-3xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-black grid place-items-center text-white font-bold text-xs">AW</div>
              <div>
                <div className="font-semibold text-neutral-900">ArkWork Agent</div>
                <div className="text-xs text-neutral-500">Berita • Kerja • Konsultasi • Employer</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowProfile(true)}
                className="px-2 py-1 text-xs rounded-lg border border-neutral-300 hover:bg-neutral-200"
              >
                Profil
              </button>
              <button
                onClick={resetChat}
                className="px-2 py-1 text-xs rounded-lg border border-neutral-300 hover:bg-neutral-200"
              >
                Reset
              </button>
              <button
                className="p-2 rounded-lg hover:bg-neutral-200"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages + Suggestions */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto px-3 py-3 space-y-2">
            {msgs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">
                Mulai percakapan. Contoh:
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="rounded-full border px-3 py-1 text-xs hover:bg-neutral-100 border-neutral-300"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              msgs.map((m) => (
                <div
                  key={m.id}
                  className={['flex items-end gap-2', m.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
                >
                  {m.role === 'assistant' && (
                    <div className="h-7 w-7 shrink-0 rounded-lg bg-black text-white grid place-items-center text-xs">AW</div>
                  )}

                  <div
                    className={[
                      'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                      m.role === 'user' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-900',
                    ].join(' ')}
                  >
                    {m.role === 'assistant' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: (p) => <h1 className="text-base font-semibold mb-1" {...p} />,
                          h2: (p) => <h2 className="text-sm font-semibold mt-2 mb-1" {...p} />,
                          h3: (p) => <h3 className="text-sm font-semibold mt-2 mb-1" {...p} />,
                          ul: (p) => <ul className="list-disc pl-5 space-y-1 my-1" {...p} />,
                          ol: (p) => <ol className="list-decimal pl-5 space-y-1 my-1" {...p} />,
                          li: (p) => <li className="leading-5" {...p} />,
                          p:  (p) => <p className="leading-6 my-1" {...p} />,
                          code: (p) => <code className="rounded bg-neutral-200 px-1 py-[1px] text-[0.85em]" {...p} />,
                          pre: (p) => (
                            <pre
                              className="my-2 max-w-full overflow-x-auto rounded-lg bg-neutral-900 text-neutral-100 p-3 text-xs"
                              {...p}
                            />
                          ),
                          a: (p) => <a className="underline text-blue-600" target="_blank" rel="noreferrer" {...p} />
                        }}
                      >
                        {m.text}
                      </ReactMarkdown>
                    ) : (
                      <div className="whitespace-pre-wrap">{m.text}</div>
                    )}

                    <div className="mt-1 text-[10px] opacity-60 text-right">{formatTime(m.ts)}</div>
                  </div>
                </div>
              ))
            )}

            {busy && (
              <div className="flex items-end gap-2">
                <div className="h-7 w-7 shrink-0 rounded-lg bg-black text-white grid place-items-center text-xs">AW</div>
                <div className="bg-neutral-100 text-neutral-900 rounded-2xl px-3 py-2 text-sm">
                  mengetik<span className="animate-pulse">…</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={onSubmit} className="border-t border-neutral-200 p-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya berita migas, minta JD, rekomendasi kerja, atau konsultasi…"
                className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
              <button
                disabled={!input.trim() || busy}
                className="rounded-xl px-3 py-2 text-sm font-medium bg-black text-white disabled:opacity-60"
              >
                Kirim
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Sheet */}
      {open && showProfile && (
        <ProfileSheet
          profile={profile}
          onClose={() => setShowProfile(false)}
          onSave={(p) => {
            setProfile(p);
            setShowProfile(false);
          }}
        />
      )}
    </>
  );
}

/* ===================== Profile Sheet ===================== */
function ProfileSheet({
  profile,
  onClose,
  onSave,
}: {
  profile: Profile;
  onClose: () => void;
  onSave: (p: Profile) => void;
}) {
  const [form, setForm] = useState<Profile>(profile || {});
  return (
    <div className="fixed inset-0 z-50 grid place-items-end pointer-events-none">
      <div className="absolute inset-0 bg-black/30 pointer-events-auto" onClick={onClose} />
      <div className="relative m-4 w-[min(92vw,380px)] pointer-events-auto rounded-2xl border border-neutral-200 bg-white shadow-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Profil ArkWork</div>
          <button onClick={onClose} aria-label="Tutup" className="p-2 rounded-lg hover:bg-neutral-100">
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <Input label="Nama (opsional)" value={form.name || ''} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="Role saat ini" value={form.role || ''} onChange={(v) => setForm({ ...form, role: v })} />
          <Input label="Skills utama" value={form.skills || ''} onChange={(v) => setForm({ ...form, skills: v })} />
          <Input label="Lokasi" value={form.location || ''} onChange={(v) => setForm({ ...form, location: v })} />
          <Input
            label="Pengalaman (tahun)"
            value={String(form.experienceYears ?? '')}
            onChange={(v) => setForm({ ...form, experienceYears: v ? Number(v) : undefined })}
            type="number"
          />
          <Input label="Minat/target" value={form.interests || ''} onChange={(v) => setForm({ ...form, interests: v })} />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg border border-neutral-300">
            Batal
          </button>
          <button onClick={() => onSave(form)} className="px-3 py-2 text-sm rounded-lg bg-black text-white">
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== Small Input ===================== */
function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-neutral-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
      />
    </label>
  );
}
