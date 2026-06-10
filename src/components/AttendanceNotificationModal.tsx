'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { clearAttendanceNotificationAction } from '@/app/actions/auth';

interface Attendance {
  id: number;
  time: string;
  status: string;
}

interface Student {
  id: number;
  name: string;
}

interface ChildData {
  student: Student;
  today_attendance: Attendance | null;
}

interface AttendanceNotificationModalProps {
  childrenData: ChildData[];
  showNotification: boolean;
}

export default function AttendanceNotificationModal({
  childrenData,
  showNotification,
}: AttendanceNotificationModalProps) {
  const [isOpen, setIsOpen] = useState(showNotification);

  useEffect(() => {
    if (showNotification) {
      clearAttendanceNotificationAction();
    }
  }, [showNotification]);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Modal Box */}
      <div className="relative bg-white rounded-3xl w-full max-w-sm p-6 overflow-hidden shadow-2xl border border-slate-100 z-50 text-center space-y-5 animate-slide-in">
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-1 bg-slate-50 rounded-full cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Banner */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-md shadow-emerald-50 select-none">
          📢
        </div>

        {/* Header */}
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-800">Laporan Kehadiran Hari Ini</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{todayStr}</p>
        </div>

        {/* Children Status Info */}
        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
          {childrenData.map((data) => {
            const att = data.today_attendance;
            const hasAtt = att !== null;
            return (
              <div key={data.student.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${hasAtt ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Status Anak:</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">{data.student.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-semibold leading-relaxed">
                    {hasAtt ? (
                      <>
                        Alhamdulillah, telah hadir di sekolah pada pukul{' '}
                        <strong className="text-slate-800">{att.time.substring(0, 5)} WIB</strong>{' '}
                        ({att.status === 'present' ? 'Hadir Tepat Waktu' : 'Terlambat'}).
                      </>
                    ) : (
                      'Belum ada catatan kehadiran/presensi dari guru kelas untuk hari ini.'
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-100 transition-all cursor-pointer"
        >
          Tutup Notifikasi
        </button>
      </div>
    </div>
  );
}
