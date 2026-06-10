'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function storeTeacherAction(prevState: any, formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    return { error: 'Akses ditolak.' };
  }

  const name = formData.get('name') as string;
  const username = formData.get('username') as string; // NIG
  const className = formData.get('class_name') as string;

  if (!name || !username || !className) {
    return { error: 'Semua kolom wajib diisi.' };
  }

  try {
    // Check if username/NIG unique
    const existing = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (existing) {
      return { error: 'Username / Nomor Induk Guru (NIG) sudah terdaftar.' };
    }

    // Default password is NIG
    const defaultPassword = await hashPassword(username.trim());

    await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        password: defaultPassword,
        role: 'teacher',
        className: className.trim(),
      },
    });

    revalidatePath('/admin/teachers');
    return { success: true, message: 'Data Guru berhasil disimpan. Username & Password adalah No Induk Guru (NIG).' };
  } catch (error: any) {
    console.error('Store teacher error:', error);
    return { error: 'Gagal menyimpan data guru. Silakan coba lagi.' };
  }
}
