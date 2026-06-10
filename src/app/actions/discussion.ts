'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function storeDiscussionAction(prevState: any, formData: FormData) {
  const session = await getSession();

  if (!session) {
    return { error: 'Anda harus login terlebih dahulu.' };
  }

  if (session.role === 'admin') {
    return { error: 'Super Admin tidak memiliki akses ke forum diskusi.' };
  }

  const message = formData.get('message') as string;
  const replyToIdStr = formData.get('reply_to_id') as string | null;
  const replyToId = replyToIdStr ? parseInt(replyToIdStr, 10) : null;

  if (!message || message.trim().length === 0) {
    return { error: 'Pesan tidak boleh kosong.' };
  }

  if (message.length > 1000) {
    return { error: 'Pesan terlalu panjang (maksimal 1000 karakter).' };
  }

  try {
    // Verify reply exists if provided
    if (replyToId) {
      const parentMsg = await prisma.discussion.findUnique({
        where: { id: replyToId },
      });
      if (!parentMsg) {
        return { error: 'Pesan balasan tidak valid atau telah dihapus.' };
      }
    }

    // Create discussion
    await prisma.discussion.create({
      data: {
        userId: session.userId,
        message: message.trim(),
        replyToId: replyToId,
      },
    });

    revalidatePath('/discussions');
    return { success: true };
  } catch (error: any) {
    console.error('Discussion store error:', error);
    return { error: 'Gagal mengirim pesan. Silakan coba lagi.' };
  }
}
