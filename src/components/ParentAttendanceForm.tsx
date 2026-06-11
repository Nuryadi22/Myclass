'use client';

import React, { useState, useTransition } from 'react';
import { storeAttendanceRequestAction } from '@/app/actions/parent';
import { Loader2, Calendar, FileText, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  className: string;
  studentId: string;
}

interface ParentAttendanceFormProps {
  students: Student[];
}

export default function ParentAttendanceForm({ students }: ParentAttendanceFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedStudent, setSelectedStudent] = useState<string>(
    students.length > 0 ? students[0].id.toString() : ''
  );

  const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta' }).format(new Date());

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const formEl = e.currentTarget;

    startTransition(async () => {
      const result = await storeAttendanceRequestAction(null, formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.message || 'Pengajuan absensi berhasil dikirim.');
        formEl.reset();
        // Keep the student selected
        if (students.length > 0) {
          setSelectedStudent(students[0].id.toString());
        }
      }
    });
  };

  if (students.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-xs">
      <div>
        <h3 className="font-extrabold text-slate-850 text-lg flex items-center gap-2 text-emerald-700">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <span>Pengajuan Izin & Sakit Anak</span>
        </h3>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Kirim pemberitahuan izin atau sakit anak ke guru kelas dengan melampirkan foto bukti.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl flex items-start gap-3 text-xs animate-shake">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Gagal mengirim: </span>
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
        {/* Child selection (only show if multiple children) */}
        {students.length > 1 ? (
          <div>
            <label htmlFor="student_id" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Pilih Anak
            </label>
            <select
              id="student_id"
              name="student_id"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-xs font-semibold transition-all cursor-pointer"
            >
              {students.map((std) => (
                <option key={std.id} value={std.id}>
                  {std.name} ({std.className})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="student_id" value={selectedStudent} />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Status Pengajuan
            </label>
            <select
              id="status"
              name="status"
              required
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-xs font-semibold transition-all cursor-pointer"
            >
              <option value="sick">Sakit</option>
              <option value="excused">Izin / Keperluan Lain</option>
            </select>
          </div>

          <div>
            <label htmlFor="date" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Tanggal Berhalangan
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={todayStr}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-xs font-semibold transition-all cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reason" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Alasan / Keterangan
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            placeholder="Tulis alasan singkat (contoh: Anak demam tinggi, Izin acara keluarga, dll)"
            className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-xs font-semibold transition-all"
          />
        </div>

        <div>
          <label htmlFor="photo" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Foto Bukti (Surat Dokter / Surat Izin)
          </label>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="photo"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-500 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                  Klik untuk unggah foto bukti
                </p>
                <p className="text-[9px] text-slate-400 mt-1 font-semibold">
                  PNG, JPG, JPEG (Maks. 5MB)
                </p>
              </div>
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                className="hidden"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-100 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mengirim Pengajuan...</span>
            </>
          ) : (
            <span>Kirim Pengajuan</span>
          )}
        </button>
      </form>
    </div>
  );
}
