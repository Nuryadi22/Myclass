'use client';

import React, { useState, useTransition } from 'react';
import { approveOrRejectAttendanceAction } from '@/app/actions/teacher';
import { X, Check, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

interface ParentRequest {
  id: number;
  studentId: number;
  student: {
    name: string;
    studentId: string;
    className: string;
  };
  parent: {
    name: string;
  };
  date: string;
  status: string; // "sick" or "excused"
  reason: string | null;
  photoPath: string | null;
  statusApproval: string;
}

interface PendingRequestsModalProps {
  requests: ParentRequest[];
}

export default function PendingRequestsModal({ requests: initialRequests }: PendingRequestsModalProps) {
  const [requests, setRequests] = useState<ParentRequest[]>(initialRequests);
  const [isOpen, setIsOpen] = useState(initialRequests.length > 0);
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!isOpen || requests.length === 0) return null;

  const handleAction = (id: number, approvalStatus: 'approved' | 'rejected') => {
    setLoadingId(id);
    startTransition(async () => {
      const result = await approveOrRejectAttendanceAction(id, approvalStatus);
      if (result?.success) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        if (requests.length <= 1) {
          setIsOpen(false);
        }
      } else {
        alert(result?.error || 'Gagal memproses pengajuan.');
      }
      setLoadingId(null);
    });
  };

  return (
    <>
      {/* Outer Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Modal Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
          {/* Header */}
          <div className="bg-indigo-900 text-white p-5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">✉️</span>
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider">Pengajuan Izin & Sakit Wali Murid</h3>
                <p className="text-[10px] text-indigo-200 font-semibold">
                  Terdapat {requests.length} pengajuan tertunda yang memerlukan tinjauan Anda.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* List Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
            {requests.map((req) => {
              const formattedDate = new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date(req.date));

              return (
                <div
                  key={req.id}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col md:flex-row justify-between gap-5 relative hover:shadow-xs transition-shadow"
                >
                  <div className="space-y-3 flex-1">
                    {/* Header info */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          req.status === 'sick'
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        }`}
                      >
                        {req.status === 'sick' ? '🤒 Sakit' : '✉️ Izin'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{formattedDate}</span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{req.student.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Diajukan oleh: <span className="font-bold text-slate-500">{req.parent.name}</span>
                      </p>
                    </div>

                    {/* Reason */}
                    {req.reason && (
                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Keterangan:</span>
                        "{req.reason}"
                      </div>
                    )}
                  </div>

                  {/* Photo attachment & Actions */}
                  <div className="flex flex-col justify-between items-start md:items-end gap-4 md:w-48 flex-shrink-0">
                    {/* Photo thumbnail */}
                    {req.photoPath ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 w-full h-24 bg-slate-100 flex items-center justify-center">
                        <img
                          src={`/${req.photoPath}`}
                          alt="Surat Bukti"
                          className="object-cover w-full h-full cursor-zoom-in"
                          onClick={() => setSelectedPhoto(`/${req.photoPath}`)}
                        />
                        <div
                          className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                          onClick={() => setSelectedPhoto(`/${req.photoPath}`)}
                        >
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 w-full py-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        Tanpa Lampiran Foto
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleAction(req.id, 'rejected')}
                        disabled={isPending && loadingId === req.id}
                        className="flex-1 py-2 bg-red-50 border border-red-100 hover:bg-red-100 disabled:opacity-50 text-red-600 font-bold rounded-xl text-[10px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {isPending && loadingId === req.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        <span>Tolak</span>
                      </button>

                      <button
                        onClick={() => handleAction(req.id, 'approved')}
                        disabled={isPending && loadingId === req.id}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-[10px] shadow-sm shadow-emerald-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {isPending && loadingId === req.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Setujui</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center flex-shrink-0">
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
            >
              Tutup & Tinjau Nanti
            </button>
          </div>
        </div>
      </div>

      {/* Large Photo Preview Modal (Portal overlay) */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-slate-950/80 z-[60] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <img src={selectedPhoto} alt="Surat Bukti Besar" className="object-contain max-h-[85vh] w-full" />
            <button
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors cursor-pointer"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
