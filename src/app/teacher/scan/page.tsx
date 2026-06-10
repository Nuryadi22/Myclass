import React from 'react';
import { prisma } from '@/lib/db';
import AttendanceScanner from '@/components/AttendanceScanner';

export const dynamic = 'force-dynamic';

export default async function TeacherScanPage() {
  // Fetch students for manual entry dropdown list
  const students = await prisma.student.findMany({
    select: {
      id: true,
      name: true,
      studentId: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Pencatatan Kehadiran Siswa</h2>
        <p className="text-slate-500 text-sm font-semibold">
          Lakukan pemindaian kartu absensi QR Code siswa atau isi kehadiran manual.
        </p>
      </div>

      <AttendanceScanner students={students} />
    </div>
  );
}
