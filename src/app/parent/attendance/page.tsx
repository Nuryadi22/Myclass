import React from 'react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ParentAttendanceForm from '@/components/ParentAttendanceForm';
import { Calendar, Clock, CheckCircle2, XCircle, FileImage, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ParentAttendancePage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Fetch children for this parent
  const children = await prisma.student.findMany({
    where: { parentId: session.userId },
  });

  // Fetch historical attendance requests
  const requests = await prisma.parentAttendanceRequest.findMany({
    where: { parentId: session.userId },
    include: {
      student: {
        select: {
          name: true,
          className: true,
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  const dateLocaleOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Absensi Anak</h2>
        <p className="text-slate-500 text-sm font-semibold">
          Ajukan permohonan izin atau sakit untuk anak Anda, serta pantau riwayat persetujuannya di sini.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Excuse Request Form */}
        <div className="lg:col-span-1">
          <ParentAttendanceForm students={children} />
        </div>

        {/* History Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-extrabold text-slate-850 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>Riwayat Pengajuan Izin & Sakit</span>
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Daftar pengajuan ketidakhadiran yang telah Anda kirimkan ke guru kelas.
              </p>
            </div>

            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold">
                  Belum ada riwayat pengajuan izin atau sakit.
                </div>
              ) : (
                requests.map((req) => {
                  const formattedDate = new Intl.DateTimeFormat('id-ID', {
                    ...dateLocaleOptions,
                    timeZone: 'Asia/Jakarta',
                  }).format(new Date(req.date));

                  // Approval Status configuration
                  let approvalBg = 'bg-amber-50 border-amber-100 text-amber-800';
                  let approvalText = 'Menunggu Persetujuan';
                  let approvalIcon = <Clock className="w-3.5 h-3.5 text-amber-600" />;

                  if (req.statusApproval === 'approved') {
                    approvalBg = 'bg-emerald-50 border-emerald-100 text-emerald-800';
                    approvalText = 'Disetujui';
                    approvalIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
                  } else if (req.statusApproval === 'rejected') {
                    approvalBg = 'bg-red-50 border-red-100 text-red-800';
                    approvalText = 'Ditolak';
                    approvalIcon = <XCircle className="w-3.5 h-3.5 text-red-600" />;
                  }

                  return (
                    <div
                      key={req.id}
                      className="p-5 border border-slate-100 rounded-2xl bg-slate-50/30 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                    >
                      <div className="space-y-2">
                        {/* Child and Date info */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-800">{req.student.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            ({req.student.className})
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                            {formattedDate}
                          </span>
                        </div>

                        {/* Status Type (Sick vs Excused) */}
                        <div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                              req.status === 'sick'
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            }`}
                          >
                            {req.status === 'sick' ? '🤒 Sakit' : '✉️ Izin'}
                          </span>
                        </div>

                        {/* Reason Keterangan */}
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          <span className="font-bold text-slate-800">Alasan:</span> {req.reason || '-'}
                        </p>

                        {/* Image link */}
                        {req.photoPath && (
                          <div className="pt-1">
                            <a
                              href={`/${req.photoPath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                            >
                              <FileImage className="w-4 h-4 text-emerald-600" />
                              <span>Lihat Foto Bukti</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Approval Status Badge */}
                      <div className="flex-shrink-0 self-start sm:self-center">
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${approvalBg}`}
                        >
                          {approvalIcon}
                          <span>{approvalText}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
