import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { prisma } from '@/lib/db';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session || session.role !== 'parent') {
    redirect('/');
  }

  // Fetch parent's children to display their names below the parent's username
  const childrenData = await prisma.student.findMany({
    where: { parentId: session.userId },
    select: { name: true },
  });

  const childNames = childrenData.map((c) => c.name).join(', ');

  return (
    <DashboardLayout user={session} childName={childNames || undefined}>
      {children}
    </DashboardLayout>
  );
}
