'use client';

import React, { useState, useTransition } from 'react';
import { storeStudentAction } from '@/app/actions/teacher';
import { Loader2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function StudentForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const formEl = e.currentTarget;

    startTransition(async () => {
      const result = await storeStudentAction(null, formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.message || 'Siswa berhasil ditambahkan.');
        formEl.reset();
      }
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-xs">
      <div>
        <h3 className="font-extrabold text-slate-850 text-lg flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          <span>Tambah Siswa Baru</span>
        </h3>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Daftarkan siswa baru. Sistem akan otomatis membuat akun untuk orang tua.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl flex items-start gap-3 text-xs animate-shake">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Gagal menyimpan: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-start gap-3 text-xs animate-slide-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Berhasil: </span>
            <span>{success}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Nama Lengkap Siswa
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-slate-800 focus:bg-white text-xs font-semibold transition-all"
            placeholder="Contoh: Ahmad Fauzi"
          />
        </div>

        <div>
          <label htmlFor="student_id" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Nomor Induk Siswa Nasional (NISN)
          </label>
          <input
            id="student_id"
            name="student_id"
            type="text"
            required
            className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-slate-800 focus:bg-white text-xs font-semibold transition-all"
            placeholder="NISN sebagai Username & Password Ortu"
          />
        </div>

        <div>
          <label htmlFor="parent_name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Nama Lengkap Wali / Orang Tua
          </label>
          <input
            id="parent_name"
            name="parent_name"
            type="text"
            required
            className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-slate-800 focus:bg-white text-xs font-semibold transition-all"
            placeholder="Contoh: Hendra Wijaya"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-slate-100 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>Simpan Data Siswa</span>
          )}
        </button>
      </form>
    </div>
  );
}
