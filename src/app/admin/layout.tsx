import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session || session.role !== 'admin') {
    redirect('/');
  }

  return <DashboardLayout user={session}>{children}</DashboardLayout>;
}
