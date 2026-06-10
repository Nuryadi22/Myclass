import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role === 'admin') {
    return NextResponse.json({ error: 'Admins do not have access' }, { status: 403 });
  }

  try {
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

    return NextResponse.json(discussions);
  } catch (error: any) {
    console.error('API Discussions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch discussions' }, { status: 500 });
  }
}
