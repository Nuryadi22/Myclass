import React from 'react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ClipboardList, Calendar, Award, ImageIcon, CheckSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ParentReportsPage() {
  const session = await getSession();

  if (!session) {
    return null; // Handled by middleware redirect
  }

  // Fetch parent's children
  const children = await prisma.student.findMany({
    where: { parentId: session.userId },
  });

  const today = new Date();
  const thisMonth = today.getMonth() + 1; // 1-indexed
  const thisYear = today.getFullYear();
  const yearMonthStr = `${thisYear}-${thisMonth.toString().padStart(2, '0')}`; // YYYY-MM

  const reportsData = [];

  for (const child of children) {
    const activities = await prisma.activity.findMany({
      where: { studentId: child.id },
      orderBy: { createdAt: 'desc' },
    });

    const creativities = await prisma.creativity.findMany({
      where: { studentId: child.id },
      orderBy: { createdAt: 'desc' },
    });

    const attendances = await prisma.attendance.findMany({
      where: { studentId: child.id },
      orderBy: { date: 'desc' },
    });

    const prayers = await prisma.prayer.findMany({
      where: { studentId: child.id },
      orderBy: { date: 'desc' },
    });

    // Calculate monthly statistics
    const totalPresent = await prisma.attendance.count({
      where: {
        studentId: child.id,
        date: { startsWith: yearMonthStr },
        status: { in: ['present', 'late'] },
      },
    });

    const totalLate = await prisma.attendance.count({
      where: {
        studentId: child.id,
        date: { startsWith: yearMonthStr },
        status: 'late',
      },
    });

    const totalAbsent = await prisma.attendance.count({
      where: {
        studentId: child.id,
        date: { startsWith: yearMonthStr },
        status: 'absent',
      },
    });

    reportsData.push({
      student: child,
      activities,
      creativities,
      attendances,
      prayers,
      stats: {
        present: totalPresent,
        late: totalLate,
        absent: totalAbsent,
      },
    });
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Rekap Laporan Perkembangan Anak</h2>
        <p className="text-slate-500 text-sm font-semibold">
          Analisis absensi kehadiran bulanan, log aktivitas poin, dan arsip karya kreativitas anak.
        </p>
      </div>

      <div className="space-y-8">
        {reportsData.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xs text-center text-slate-400 font-bold">
            Belum ada anak yang ditautkan ke akun Anda.
          </div>
        ) : (
          reportsData.map((data) => {
            const student = data.student;
            const stats = data.stats;

            return (
              <div
                key={student.id}
                className="bg-white rounded-3xl border border-slate-100 p-6 space-y-8 shadow-xs animate-slide-in"
              >
                {/* Child Mini Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-50 pb-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-sm shadow-3xs">
                      {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{student.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Kelas: {student.className} | NISN: {student.studentId}
                      </p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 text-emerald-800 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-3xs">
                    ⭐ Total: {student.totalPoints} Poin
                  </div>
                </div>

                {/* Statistics Box */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-emerald-600" />
                    <span>Statistik Kehadiran Bulan Ini ({new Date().toLocaleString('id-ID', { month: 'long' })})</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100/30 rounded-2xl text-center shadow-3xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Total Hadir</span>
                      <span className="text-xl font-extrabold text-emerald-800 block mt-1">{stats.present} Hari</span>
                    </div>
                    <div className="p-4 bg-amber-50/50 border border-amber-100/30 rounded-2xl text-center shadow-3xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Terlambat</span>
                      <span className="text-xl font-extrabold text-amber-800 block mt-1">{stats.late} Kali</span>
                    </div>
                    <div className="p-4 bg-red-50/50 border border-red-100/30 rounded-2xl text-center shadow-3xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 block">Alfa / Absen</span>
                      <span className="text-xl font-extrabold text-red-700 block mt-1">{stats.absent} Kali</span>
                    </div>
                  </div>
                </div>

                {/* Sub-Logs Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Activities log */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>Log Riwayat Aktivitas & Poin</span>
                    </h4>
                    <div className="max-h-72 overflow-y-auto pr-1 space-y-2.5">
                      {data.activities.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">Belum ada riwayat aktivitas.</p>
                      ) : (
                        data.activities.map((act) => (
                          <div
                            key={act.id}
                            className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100/50 rounded-2xl text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-800 block leading-tight">{act.title}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase block mt-0.5">Tipe: {act.type}</span>
                            </div>
                            <span className={`font-extrabold ${act.pointsImpact > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {act.pointsImpact > 0 ? `+${act.pointsImpact}` : act.pointsImpact}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Creativity log */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-455 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-650" />
                      <span>Portofolio Kreativitas</span>
                    </h4>
                    <div className="max-h-72 overflow-y-auto pr-1 space-y-3">
                      {data.creativities.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center col-span-2">Belum ada karya diunggah.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {data.creativities.map((cr) => (
                            <div key={cr.id} className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shadow-3xs">
                              <div className="aspect-video bg-slate-200">
                                <img src={`/${cr.imagePath}`} alt={cr.title} className="object-cover w-full h-full" />
                              </div>
                              <div className="p-2.5">
                                <h5 className="font-extrabold text-slate-850 text-[10px] truncate">{cr.title}</h5>
                                <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">⭐ +{cr.pointsAwarded} Poin</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Attendance Log */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-455 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-655" />
                      <span>Riwayat Kehadiran Lengkap</span>
                    </h4>
                    <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
                      {data.attendances.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">Belum ada riwayat kehadiran.</p>
                      ) : (
                        data.attendances.map((att) => {
                          const dateText = new Date(att.date).toLocaleDateString('id-ID', {
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
                                <span className="font-bold text-slate-800 block leading-tight">{dateText}</span>
                                <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Jam: {att.time.substring(0, 5)} WIB</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                                att.status === 'present'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : att.status === 'late'
                                  ? 'bg-amber-50 text-amber-700'
                                  : att.status === 'sick'
                                  ? 'bg-blue-50 text-blue-700'
                                  : att.status === 'excused'
                                  ? 'bg-indigo-50 text-indigo-700'
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

                  {/* Prayer logs */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-455 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-emerald-655" />
                      <span>Rekap Shalat Mandiri di Rumah</span>
                    </h4>
                    <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
                      {data.prayers.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">Belum ada riwayat shalat.</p>
                      ) : (
                        data.prayers.map((pr) => {
                          const dateText = new Date(pr.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          });
                          const checked = [pr.subuh, pr.dzuhur, pr.ashar, pr.maghrib, pr.isya].filter(Boolean).length;
                          return (
                            <div key={pr.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs">
                              <div className="flex items-center justify-between font-bold text-slate-800">
                                <span>{dateText}</span>
                                <span className="text-[10px] text-emerald-600">{checked} / 5 Waktu</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${pr.subuh ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>Subuh</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${pr.dzuhur ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>Dzuhur</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${pr.ashar ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>Ashar</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${pr.maghrib ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>Maghrib</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${pr.isya ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>Isya</span>
                              </div>
                              {pr.notes && <p className="text-[10px] text-slate-400 font-semibold bg-white p-1.5 rounded border border-slate-100 leading-normal">Catatan: {pr.notes}</p>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
