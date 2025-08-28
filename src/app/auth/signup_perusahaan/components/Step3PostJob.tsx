'use client';

import Card from './Card';
import { NewJob } from '../types';

export default function Step3PostJob({
  job, setJob, error, onBack, onNext,
}: {
  job: NewJob;
  setJob: (updater: (j: NewJob) => NewJob) => void;
  error: string | null;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Pasang Lowongan</h2>
          <p className="mt-1 text-sm text-slate-600">Jelaskan posisi, bidang, dan kualifikasi agar kandidat tepat.</p>
        </div>
        <div className="hidden rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 md:block">
          <div className="font-semibold">Tips</div>
          <ul className="mt-1 list-disc pl-4">
            <li>Gunakan judul spesifik</li>
            <li>Jelaskan tanggung jawab & benefit</li>
            <li>Tuliskan kualifikasi yang jelas</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-5">
        <label className="block">
          <span className="mb-1 block text-sm text-slate-600">Posisi Pekerjaan</span>
          <input
            value={job.title}
            onChange={(e) => setJob((j) => ({ ...j, title: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            placeholder="Masukan posisi pekerjaan"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-600">Bidang Pekerjaan</span>
          <select
            value={job.functionArea}
            onChange={(e) => setJob((j) => ({ ...j, functionArea: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Pilih bidang pekerjaan</option>
            <option>Engineering</option>
            <option>Product</option>
            <option>Design</option>
            <option>Marketing</option>
            <option>Finance</option>
            <option>HR</option>
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Level</span>
            <select
              value={job.level}
              onChange={(e) => setJob((j) => ({ ...j, level: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Pilih level</option>
              <option>Intern</option>
              <option>Junior</option>
              <option>Mid</option>
              <option>Senior</option>
              <option>Manager</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Tipe Kerja</span>
            <select
              value={job.type}
              onChange={(e) => setJob((j) => ({ ...j, type: e.target.value as NewJob['type'] }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Mode Kerja</span>
            <select
              value={job.workMode}
              onChange={(e) => setJob((j) => ({ ...j, workMode: e.target.value as NewJob['workMode'] }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="onsite">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Lokasi</span>
            <input
              value={job.location}
              onChange={(e) => setJob((j) => ({ ...j, location: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Jakarta / Surabaya / Remote"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Batas Lamar (opsional)</span>
            <input
              type="date"
              value={job.deadline}
              onChange={(e) => setJob((j) => ({ ...j, deadline: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-600">Deskripsi</span>
          <textarea
            value={job.description}
            onChange={(e) => setJob((j) => ({ ...j, description: e.target.value }))}
            rows={5}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            placeholder="Gambarkan tanggung jawab, budaya tim, benefit, dll."
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-600">Kualifikasi</span>
          <textarea
            value={job.requirements}
            onChange={(e) => setJob((j) => ({ ...j, requirements: e.target.value }))}
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            placeholder="Contoh: 3+ tahun pengalaman React, terbiasa Next.js, dsb."
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-600">Tags (pisahkan koma)</span>
          <input
            value={job.tags}
            onChange={(e) => setJob((j) => ({ ...j, tags: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            placeholder="react, nextjs, tailwind"
          />
        </label>

        <div className="mt-2 flex justify-between">
          <button onClick={onBack} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50">
            Kembali
          </button>
          <button onClick={onNext} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Selanjutnya
          </button>
        </div>
      </div>
    </Card>
  );
}
