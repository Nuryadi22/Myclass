import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import DiscussionBoard from '@/components/DiscussionBoard';
import { prisma } from '@/lib/db';

export default async function DiscussionsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  if (session.role === 'admin') {
    redirect('/admin/dashboard');
  }

  // Fetch all discussions
  const discussions = await prisma.discussion.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          className: true,
        },
      },
      replyTo: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return (
    <DashboardLayout user={session}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Forum Diskusi</h2>
          <p className="text-slate-500 text-sm">
            Portal komunikasi dua arah antara Guru Kelas dan Orang Tua / Wali Murid.
          </p>
        </div>
        <DiscussionBoard initialDiscussions={discussions} currentUser={session} />
      </div>
    </DashboardLayout>
  );
}
