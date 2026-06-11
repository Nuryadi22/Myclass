'use client';

import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface ClassCashPieChartProps {
  className: string;
  totalIncome: number;
  totalExpense: number;
}

export default function ClassCashPieChart({
  className,
  totalIncome,
  totalExpense,
}: ClassCashPieChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const balance = totalIncome - totalExpense;

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const hasData = totalIncome > 0 || totalExpense > 0;

    chartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: hasData ? ['Pemasukan', 'Pengeluaran'] : ['Belum Ada Transaksi'],
        datasets: [
          {
            data: hasData ? [totalIncome, totalExpense] : [1],
            backgroundColor: hasData
              ? ['rgb(16, 185, 129)', 'rgb(239, 68, 68)'] // Emerald vs Red
              : ['rgb(226, 232, 240)'], // Slate-200
            borderWidth: 1.5,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: { weight: 'bold', size: 10 },
              padding: 10,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                if (!hasData) return ' Tidak ada transaksi';
                const val = context.raw as number;
                return ` Rp ${val.toLocaleString('id-ID')}`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [totalIncome, totalExpense, className]);

  return (
    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
      {/* Header with name and current balance */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Kas Kelas ({className})</h4>
        <div className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg select-none">
          Saldo: Rp {balance.toLocaleString('id-ID')}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative h-48 w-full flex items-center justify-center">
        <canvas ref={chartRef} id={`class-cash-chart-${className.replace(/\s+/g, '-')}`}></canvas>
      </div>
    </div>
  );
}
