import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session || session.role !== 'parent') {
    redirect('/');
  }

  return <DashboardLayout user={session}>{children}</DashboardLayout>;
}
