'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { comparePassword, signJWT } from '@/lib/auth';

export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username dan Password wajib diisi.' };
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return { error: 'Nomor Induk / Username / Password yang Anda masukkan salah.' };
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return { error: 'Nomor Induk / Username / Password yang Anda masukkan salah.' };
    }

    // Sign JWT
    const token = await signJWT({
      userId: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      className: user.className,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2, // 2 hours
    });

    // Set flag in cookies for parent attendance notification
    if (user.role === 'parent') {
      cookieStore.set('show_attendance_notification', 'true', {
        path: '/',
        maxAge: 60, // 1 minute
      });
    }

    return { success: true, role: user.role };
  } catch (error: any) {
    console.error('Login error:', error);
    return { error: 'Terjadi kesalahan sistem. Silakan coba lagi.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  redirect('/');
}

export async function clearAttendanceNotificationAction() {
  const cookieStore = await cookies();
  cookieStore.delete('show_attendance_notification');
}
