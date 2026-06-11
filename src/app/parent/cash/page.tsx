import React from 'react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ParentCashReport from '@/components/ParentCashReport';

export const dynamic = 'force-dynamic';

export default async function ParentCashPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Fetch children for this parent
  const children = await prisma.student.findMany({
    where: { parentId: session.userId },
    select: {
      id: true,
      name: true,
      className: true,
    },
  });

  const classNames = children.map((c) => c.className).filter(Boolean);

  // Fetch all transactions for the classes of the parent's children
  const transactions = classNames.length > 0
    ? await prisma.classCash.findMany({
        where: {
          className: { in: classNames },
        },
        include: {
          student: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      })
    : [];

  // Map database transactions to the expected component format
  const mappedTransactions = transactions.map((t) => ({
    id: t.id,
    className: t.className,
    type: t.type,
    studentId: t.studentId,
    studentName: t.student ? t.student.name : null,
    description: t.description,
    amount: t.amount,
    date: t.date,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Laporan Kas Kelas</h2>
        <p className="text-slate-500 text-sm font-semibold">
          Transparansi pembukuan kas kelas anak Anda. Lihat laporan pemasukan, pengeluaran, dan sisa saldo.
        </p>
      </div>

      {/* Cash Report Component */}
      <ParentCashReport
        students={children}
        initialTransactions={mappedTransactions}
      />
    </div>
  );
}
