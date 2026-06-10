import React from 'react';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import {
  GraduationCap,
  Calendar,
  Award,
  ImageIcon,
  Heart,
  ClipboardList,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherStudentReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const studentId = parseInt(id, 10);

  if (isNaN(studentId)) {
    notFound();
  }

  // Fetch student
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      parent: {
        select: { name: true, username: true, email: true },
      },
    },
  });

  if (!student) {
    notFound();
  }

  // Fetch all related logs
  const activities = await prisma.activity.findMany({
    where: { studentId },
    include: {
      teacher: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const creativities = await prisma.creativity.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });

  const attendances = await prisma.attendance.findMany({
    where: { studentId },
    include: {
      scannedBy: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
  });

  const prayers = await prisma.prayer.findMany({
    where: { studentId },
    orderBy: { date: 'desc' },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/teacher/reports"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Rekap Laporan
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Detail Laporan Siswa</h2>
        </div>
      </div>

      {/* Student Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xl shadow-xs">
            {student.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="space-y-0.5">
            <h3 className="text-lg font-extrabold text-slate-900">{student.name}</h3>
            <p className="text-xs text-slate-400 font-bold">
              Kelas: {student.className} | NISN: {student.studentId}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold">
              Orang Tua: {student.parent?.name || '-'} (Username: {student.parent?.username || '-'})
            </p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100/50 p-4 rounded-2xl text-center sm:text-right w-full sm:w-auto">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-600 block">Total Poin Akumulatif</span>
          <h4 className="text-2xl font-extrabold text-amber-800 mt-0.5">⭐ {student.totalPoints} Poin</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Logs */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-xs">
          <div>
            <h4 className="font-extrabold text-slate-855 text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-650" />
              <span>Log Riwayat Kehadiran</span>
            </h4>
            <p className="text-xs text-slate-400 font-semibold mt-1">Kehadiran harian yang dicatat oleh guru.</p>
          </div>

          <div className="max-h-96 overflow-y-auto pr-1 space-y-3">
            {attendances.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Belum ada riwayat absensi.</p>
            ) : (
              attendances.map((att) => {
                const dateStr = new Date(att.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100/50 rounded-2xl text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-slate-850 block leading-tight">{dateStr}</span>
                      <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                        Jam: {att.time.substring(0, 5)} WIB | Oleh: {att.scannedBy?.name || 'Sistem'}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                      att.status === 'present'
                        ? 'bg-emerald-50 text-emerald-700'
                        : att.status === 'late'
                        ? 'bg-amber-50 text-amber-700'
                        : att.status === 'sick'
                        ? 'bg-blue-50 text-blue-700'
                        : att.status === 'excused'
                        ? 'bg-indigo-50 text-indigo-750'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {att.status === 'present' ? 'Hadir' : att.status === 'late' ? 'Terlambat' : att.status === 'sick' ? 'Sakit' : att.status === 'excused' ? 'Izin' : 'Alfa'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Keaktifan & Punishment Logs */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-xs">
          <div>
            <h4 className="font-extrabold text-slate-855 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-650" />
              <span>Log Keaktifan & Punishment</span>
            </h4>
            <p className="text-xs text-slate-400 font-semibold mt-1">Penghargaan poin keaktifan atau pemotongan pelanggaran.</p>
          </div>

          <div className="max-h-96 overflow-y-auto pr-1 space-y-3">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Belum ada aktivitas keaktifan/hukuman.</p>
            ) : (
              activities.map((act) => {
                const dateStr = new Date(act.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <div
                    key={act.id}
                    className={`flex items-center justify-between p-3 border rounded-2xl text-xs ${
                      act.type === 'punishment'
                        ? 'bg-red-50/20 border-red-100/30'
                        : 'bg-slate-50/50 border-slate-100/50'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-slate-850 block leading-tight">{act.title}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block mt-0.5">
                        Tipe: {act.type} • Dicatat {dateStr}
                      </span>
                    </div>
                    <span className={`font-extrabold text-sm ${act.pointsImpact > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {act.pointsImpact > 0 ? `+${act.pointsImpact}` : act.pointsImpact} Poin
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Creativity Portfolio Gallery */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-xs">
          <div>
            <h4 className="font-extrabold text-slate-855 text-base flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-650" />
              <span>Portofolio Kreativitas</span>
            </h4>
            <p className="text-xs text-slate-400 font-semibold mt-1">Karya seni dan kerajinan tangan yang diunggah.</p>
          </div>

          <div className="max-h-96 overflow-y-auto pr-1 space-y-4">
            {creativities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Belum ada karya kreativitas diunggah.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {creativities.map((cr) => (
                  <div key={cr.id} className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="aspect-video bg-slate-200">
                      <img src={`/${cr.imagePath}`} alt={cr.title} className="object-cover w-full h-full" />
                    </div>
                    <div className="p-3 space-y-1">
                      <h5 className="font-extrabold text-slate-850 text-xs truncate">{cr.title}</h5>
                      <span className="text-[9px] text-emerald-600 font-extrabold block">⭐ +{cr.pointsAwarded} Poin</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Monitoring Shalat Mandiri */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-xs">
          <div>
            <h4 className="font-extrabold text-slate-855 text-base flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-650" />
              <span>Monitoring Shalat Mandiri (Rumah)</span>
            </h4>
            <p className="text-xs text-slate-400 font-semibold mt-1">Ceklis ibadah harian yang dilaporkan orang tua.</p>
          </div>

          <div className="max-h-96 overflow-y-auto pr-1 space-y-3">
            {prayers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Belum ada riwayat laporan shalat.</p>
            ) : (
              prayers.map((pr) => {
                const dateStr = new Date(pr.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <div key={pr.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{dateStr}</span>
                      <span className="text-[10px] text-indigo-600">
                        {
                          [pr.subuh, pr.dzuhur, pr.ashar, pr.maghrib, pr.isya].filter(Boolean).length
                        } / 5 Waktu
                      </span>
                    </div>
                    {/* Checkbox status pills */}
                    <div className="flex flex-wrap gap-1">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${pr.subuh ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>Subuh</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${pr.dzuhur ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>Dzuhur</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${pr.ashar ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>Ashar</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${pr.maghrib ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>Maghrib</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${pr.isya ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>Isya</span>
                    </div>
                    {pr.notes && (
                      <p className="text-[10px] text-slate-500 font-semibold bg-white p-2 rounded-lg border border-slate-100 leading-normal">
                        Catatan: {pr.notes}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
