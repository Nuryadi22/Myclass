'use client';

import React, { useTransition } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { destroyTeacherAction } from '@/app/actions/admin';

interface DeleteTeacherButtonProps {
  id: number;
  name: string;
}

export default function DeleteTeacherButton({ id, name }: DeleteTeacherButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm(`Apakah Anda yakin ingin menghapus akun guru "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      startTransition(async () => {
        const result = await destroyTeacherAction(id);
        if (result?.error) {
          alert(result.error);
        }
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
      title={`Hapus Guru ${name}`}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
