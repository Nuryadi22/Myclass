import React from 'react';
import { prisma } from '@/lib/db';
import { Users, ClipboardCheck, Star, Clock, Heart } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TeacherDashboardPage() {
  const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta' }).format(new Date());

  // Fetch counts
  const totalStudents = await prisma.student.count();
  const todayAttendance = await prisma.attendance.count({
    where: { date: todayStr },
  });
  
  const totalPointsAggregate = await prisma.student.aggregate({
    _sum: { totalPoints: true },
  });
  const totalPoints = totalPointsAggregate._sum.totalPoints || 0;

  // Recent 5 activities
  const recentActivities = await prisma.activity.findMany({
    include: {
      student: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Recent 5 creativities
  const recentCreativities = await prisma.creativity.findMany({
    include: {
      student: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard Portal Guru</h2>
        <p className="text-slate-500 text-sm font-semibold">
          Kelola kehadiran, keaktifan, dan pantau perkembangan portofolio siswa kelas Anda.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Card 1: Total Siswa */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Jumlah Siswa</span>
            <h3 className="text-3xl font-extrabold text-slate-850">{totalStudents}</h3>
            <span className="text-[10px] text-indigo-600 font-bold block">Siswa Aktif Terdaftar</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-650 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Absensi Hari Ini */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Absensi Hari Ini</span>
            <h3 className="text-3xl font-extrabold text-slate-850">{todayAttendance}</h3>
            <span className="text-[10px] text-indigo-650 font-bold block">Siswa Sudah Diabsen</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-650 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Poin Kelas */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Poin Kelas</span>
            <h3 className="text-3xl font-extrabold text-slate-850">⭐ {totalPoints}</h3>
            <span className="text-[10px] text-amber-600 font-bold block">Akumulasi Seluruh Siswa</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-650 flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities Feed */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-xs">
          <div>
            <h4 className="font-extrabold text-slate-850 text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span>Aktivitas Keaktifan Terbaru</span>
            </h4>
            <p className="text-xs text-slate-400 font-semibold mt-1">Log pencatatan aktivitas akademik siswa hari ini.</p>
          </div>

          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-450 text-center py-8">Belum ada aktivitas keaktifan yang dicatat.</p>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100/50 rounded-2xl text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">
                      {act.type === 'memorization' ? '🕌' : act.type === 'literacy' ? '📚' : act.type === 'numeracy' ? '🔢' : act.type === 'punishment' ? '⚠️' : '💡'}
                    </span>
                    <div>
                      <span className="font-extrabold text-slate-800 block leading-tight">{act.student.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">{act.type}: {act.title}</span>
                    </div>
                  </div>
                  <span className={`font-extrabold text-sm ${act.pointsImpact > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {act.pointsImpact > 0 ? `+${act.pointsImpact}` : act.pointsImpact}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Portfolios / Creativities */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-xs">
          <div>
            <h4 className="font-extrabold text-slate-850 text-base flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              <span>Karya Kreativitas Terbaru</span>
            </h4>
            <p className="text-xs text-slate-400 font-semibold mt-1">Unggahan karya kreativitas kerajinan tangan / seni siswa terbaru.</p>
          </div>

          <div className="space-y-3">
            {recentCreativities.length === 0 ? (
              <p className="text-xs text-slate-450 text-center py-8">Belum ada karya kreativitas yang diunggah.</p>
            ) : (
              recentCreativities.map((cr) => (
                <div key={cr.id} className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100/50 rounded-2xl text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 border border-slate-100 flex-shrink-0">
                      <img src={`/${cr.imagePath}`} alt={cr.title} className="object-cover w-full h-full" />
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-800 block leading-tight">{cr.student.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">{cr.title}</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-emerald-600 text-sm">+{cr.pointsAwarded} Poin</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
