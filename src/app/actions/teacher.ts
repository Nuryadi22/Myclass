'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

// Helper to generate random string for QR Code Token
function generateQrToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomStr = '';
  for (let i = 0; i < 8; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `STU-${randomStr}-${randomNum}`;
}

// 1. Add Student
export async function storeStudentAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'teacher') {
    return { error: 'Akses ditolak.' };
  }

  const name = formData.get('name') as string;
  const studentId = formData.get('student_id') as string; // NISN
  const parentName = formData.get('parent_name') as string;

  if (!name || !studentId || !parentName) {
    return { error: 'Semua kolom wajib diisi.' };
  }

  try {
    // Check unique student_id (NISN)
    const existingStudent = await prisma.student.findUnique({
      where: { studentId: studentId.trim() },
    });

    if (existingStudent) {
      return { error: 'NISN Siswa sudah terdaftar.' };
    }

    // Find or create Parent account using NISN as username and password
    let parent = await prisma.user.findFirst({
      where: { username: studentId.trim(), role: 'parent' },
    });

    if (!parent) {
      const defaultPassword = await hashPassword(studentId.trim());
      parent = await prisma.user.create({
        data: {
          name: parentName.trim(),
          username: studentId.trim(),
          password: defaultPassword,
          role: 'parent',
        },
      });
    } else {
      // Update parent name if already exists
      parent = await prisma.user.update({
        where: { id: parent.id },
        data: { name: parentName.trim() },
      });
    }

    const qrCodeToken = generateQrToken();
    const className = session.className || 'Tanpa Kelas';

    await prisma.student.create({
      data: {
        name: name.trim(),
        studentId: studentId.trim(),
        className: className,
        parentId: parent.id,
        qrCodeToken: qrCodeToken,
        totalPoints: 0,
      },
    });

    revalidatePath('/teacher/students');
    return {
      success: true,
      message: `Siswa berhasil ditambahkan. Akun Orang Tua otomatis dibuat dengan Username & Password NISN: ${studentId}`,
    };
  } catch (error: any) {
    console.error('Store student error:', error);
    return { error: 'Gagal menambahkan siswa. Silakan coba lagi.' };
  }
}

// 2. Record Attendance (handles both QR Scan and Manual Input)
export async function recordAttendanceAction(data: {
  qr_code_token?: string;
  student_id?: string;
  status?: string;
}) {
  const session = await getSession();
  if (!session || session.role !== 'teacher') {
    return { success: false, message: 'Akses ditolak.' };
  }

  try {
    let student = null;
    let status = 'present';

    if (data.student_id) {
      // Manual Input
      student = await prisma.student.findUnique({
        where: { studentId: data.student_id.trim() },
      });

      if (!student) {
        return { success: false, message: 'NISN Siswa tidak ditemukan.' };
      }

      const inputStatus = data.status ? data.status.toLowerCase() : 'hadir';
      if (inputStatus === 'hadir' || inputStatus === 'present') {
        status = 'present';
      } else if (inputStatus === 'sakit' || inputStatus === 'sick') {
        status = 'sick';
      } else if (inputStatus === 'izin' || inputStatus === 'excused') {
        status = 'excused';
      } else if (inputStatus === 'alfa' || inputStatus === 'absent') {
        status = 'absent';
      } else {
        status = 'present';
      }
    } else {
      // QR Code Scan
      if (!data.qr_code_token) {
        return { success: false, message: 'QR Code Token atau NISN wajib diisi.' };
      }

      student = await prisma.student.findUnique({
        where: { qrCodeToken: data.qr_code_token.trim() },
      });

      if (!student) {
        return { success: false, message: 'QR Code Siswa tidak terdaftar.' };
      }

      // Check current time in Asia/Jakarta. If past 07:30, mark as late.
      const d = new Date();
      const timeParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(d);
      const timePartMap = Object.fromEntries(timeParts.map(p => [p.type, p.value]));
      let hourVal = parseInt(timePartMap.hour, 10);
      if (hourVal === 24) hourVal = 0;
      const timeStr = `${hourVal.toString().padStart(2, '0')}:${timePartMap.minute}`;
      status = timeStr > '07:30' ? 'late' : 'present';
    }

    const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta' }).format(new Date()); // YYYY-MM-DD in WIB
    
    const wibParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(new Date());
    const wibPartMap = Object.fromEntries(wibParts.map(p => [p.type, p.value]));
    let wibHour = parseInt(wibPartMap.hour, 10);
    if (wibHour === 24) wibHour = 0;
    const nowTimeStr = `${wibHour.toString().padStart(2, '0')}:${wibPartMap.minute}:${wibPartMap.second}`;

    // Check if already checked in today
    const alreadyChecked = await prisma.attendance.findFirst({
      where: {
        studentId: student.id,
        date: todayStr,
      },
    });

    if (alreadyChecked) {
      if (data.student_id) {
        // Allow status updates for manual input
        await prisma.attendance.update({
          where: { id: alreadyChecked.id },
          data: {
            status: status,
            time: nowTimeStr,
            scannedById: session.userId,
          },
        });

        let label = 'Hadir';
        if (status === 'sick') label = 'Sakit';
        else if (status === 'excused') label = 'Izin';
        else if (status === 'absent') label = 'Alfa';
        else if (status === 'late') label = 'Terlambat';

        return {
          success: true,
          message: `Kehadiran ${student.name} berhasil diperbarui menjadi ${label}.`,
          studentName: student.name,
          time: nowTimeStr.substring(0, 5),
          status: status,
        };
      }

      return {
        success: false,
        message: `${student.name} sudah melakukan absensi hari ini pada pukul ${alreadyChecked.time.substring(0, 5)} WIB.`,
      };
    }

    // Create new attendance
    await prisma.attendance.create({
      data: {
        studentId: student.id,
        date: todayStr,
        time: nowTimeStr,
        status: status,
        scannedById: session.userId,
      },
    });

    let label = 'Hadir';
    if (status === 'sick') label = 'Sakit';
    else if (status === 'excused') label = 'Izin';
    else if (status === 'absent') label = 'Alfa';
    else if (status === 'late') label = 'Terlambat';

    revalidatePath('/teacher/dashboard');
    return {
      success: true,
      message: `Absensi berhasil direkam untuk ${student.name} (${label}).`,
      studentName: student.name,
      time: nowTimeStr.substring(0, 5),
      status: status,
    };
  } catch (error: any) {
    console.error('Attendance record error:', error);
    return { success: false, message: 'Gagal merekam absensi. Terjadi kesalahan sistem.' };
  }
}

// 3. Add Student Activity
export async function storeActivityAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'teacher') {
    return { error: 'Akses ditolak.' };
  }

  const studentIdStr = formData.get('student_id') as string;
  const studentId = parseInt(studentIdStr, 10);
  const type = formData.get('type') as string;
  const title = formData.get('title') as string;
  const ratingStr = formData.get('rating') as string;
  const rating = parseInt(ratingStr, 10);

  if (!studentId || !type || !title || !rating) {
    return { error: 'Semua kolom wajib diisi.' };
  }

  try {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return { error: 'Siswa tidak ditemukan.' };
    }

    const pointsImpact = rating; // 1 star = 1 point

    await prisma.$transaction([
      prisma.activity.create({
        data: {
          studentId: studentId,
          teacherId: session.userId,
          type: type,
          title: title.trim(),
          rating: rating,
          pointsImpact: pointsImpact,
        },
      }),
      prisma.student.update({
        where: { id: studentId },
        data: { totalPoints: { increment: pointsImpact } },
      }),
    ]);

    revalidatePath('/teacher/activity');
    return { success: true, message: 'Aktivitas keaktifan siswa berhasil ditambahkan.' };
  } catch (error: any) {
    console.error('Store activity error:', error);
    return { error: 'Gagal menambahkan aktivitas. Silakan coba lagi.' };
  }
}

// 4. Add Creativity (with file upload, supports multiple students)
export async function storeCreativityAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'teacher') {
    return { error: 'Akses ditolak.' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string | null;
  const pointsAwardedStr = formData.get('points_awarded') as string;
  const pointsAwarded = parseInt(pointsAwardedStr, 10);
  const imageFile = formData.get('image') as File | null;

  // Supports multiple students (sent as student_ids array or single student_id)
  const studentIdStr = formData.get('student_id') as string | null;
  const studentIdsStr = formData.getAll('student_ids') as string[];

  let studentIds: number[] = [];
  if (studentIdStr) {
    studentIds.push(parseInt(studentIdStr, 10));
  } else if (studentIdsStr && studentIdsStr.length > 0) {
    studentIds = studentIdsStr.map((id) => parseInt(id, 10));
  }

  if (studentIds.length === 0) {
    return { error: 'Anda harus memilih setidaknya satu siswa.' };
  }

  if (!title || !pointsAwarded || !imageFile || imageFile.size === 0) {
    return { error: 'Kolom Judul, Poin, dan File Gambar wajib diisi.' };
  }

  try {
    // Write image to public/creativity directory
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
    const uploadDir = join(process.cwd(), 'public', 'creativity');
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const imagePath = `creativity/${filename}`;

    // Loop through student IDs to create records
    for (const id of studentIds) {
      await prisma.$transaction([
        prisma.creativity.create({
          data: {
            studentId: id,
            teacherId: session.userId,
            title: title.trim(),
            imagePath: imagePath,
            description: description ? description.trim() : null,
            pointsAwarded: pointsAwarded,
          },
        }),
        prisma.student.update({
          where: { id: id },
          data: { totalPoints: { increment: pointsAwarded } },
        }),
        prisma.activity.create({
          data: {
            studentId: id,
            teacherId: session.userId,
            type: 'creativity',
            title: `Mengunggah Karya Kreativitas: ${title.trim()}`,
            pointsImpact: pointsAwarded,
          },
        }),
      ]);
    }

    revalidatePath('/teacher/creativity');
    return { success: true, message: 'Kreativitas siswa berhasil diunggah.' };
  } catch (error: any) {
    console.error('Store creativity error:', error);
    return { error: 'Gagal mengunggah kreativitas. Silakan coba lagi.' };
  }
}

// 5. Add Punishment
export async function storePunishmentAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'teacher') {
    return { error: 'Akses ditolak.' };
  }

  const studentIdStr = formData.get('student_id') as string;
  const studentId = parseInt(studentIdStr, 10);
  const title = formData.get('title') as string; // reason
  const pointsDeductedStr = formData.get('points_deducted') as string;
  const pointsDeducted = parseInt(pointsDeductedStr, 10);

  if (!studentId || !title || !pointsDeducted) {
    return { error: 'Semua kolom wajib diisi.' };
  }

  try {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return { error: 'Siswa tidak ditemukan.' };
    }

    const pointsImpact = -pointsDeducted;
    const newPoints = Math.max(0, student.totalPoints - pointsDeducted);

    await prisma.$transaction([
      prisma.activity.create({
        data: {
          studentId: studentId,
          teacherId: session.userId,
          type: 'punishment',
          title: title.trim(),
          pointsImpact: pointsImpact,
        },
      }),
      prisma.student.update({
        where: { id: studentId },
        data: { totalPoints: newPoints },
      }),
    ]);

    revalidatePath('/teacher/punishment');
    return { success: true, message: 'Pengurangan poin hukuman berhasil dicatat.' };
  } catch (error: any) {
    console.error('Store punishment error:', error);
    return { error: 'Gagal mencatat punishment. Silakan coba lagi.' };
  }
}

// 6. Delete Creativity record and adjust student points
export async function destroyCreativityAction(creativityId: number) {
  const session = await getSession();
  if (!session || session.role !== 'teacher') {
    return { error: 'Akses ditolak.' };
  }

  try {
    const creativity = await prisma.creativity.findUnique({
      where: { id: creativityId },
      include: { student: true }
    });

    if (!creativity) {
      return { error: 'Karya kreativitas tidak ditemukan.' };
    }

    const pointsDeducted = creativity.pointsAwarded;
    const newPoints = Math.max(0, creativity.student.totalPoints - pointsDeducted);

    await prisma.$transaction(async (tx) => {
      // 1. Delete creativity record
      await tx.creativity.delete({
        where: { id: creativityId }
      });

      // 2. Decrement student totalPoints
      await tx.student.update({
        where: { id: creativity.studentId },
        data: { totalPoints: newPoints }
      });

      // 3. Delete corresponding activity log
      await tx.activity.deleteMany({
        where: {
          studentId: creativity.studentId,
          type: 'creativity',
          title: `Mengunggah Karya Kreativitas: ${creativity.title}`,
          pointsImpact: pointsDeducted
        }
      });
    });

    // Try to delete image file from disk
    try {
      const filePath = join(process.cwd(), 'public', creativity.imagePath);
      await unlink(filePath);
    } catch (err) {
      console.warn('Could not delete creativity file on disk:', err);
    }

    revalidatePath('/teacher/creativity');
    revalidatePath(`/teacher/reports/${creativity.studentId}`);
    revalidatePath('/teacher/dashboard');
    revalidatePath('/parent/dashboard');
    revalidatePath('/parent/reports');

    return { success: true, message: 'Karya kreativitas berhasil dihapus dan poin siswa disesuaikan.' };
  } catch (error: any) {
    console.error('Delete creativity error:', error);
    return { error: 'Gagal menghapus karya kreativitas. Silakan coba lagi.' };
  }
}

