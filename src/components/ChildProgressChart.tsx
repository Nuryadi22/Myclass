'use client';

import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

interface ChildProgressChartProps {
  studentId: number;
  dailyLabels: string[];
  dailyPoints: number[];
  weeklyLabels: string[];
  weeklyPoints: number[];
}

export default function ChildProgressChart({
  studentId,
  dailyLabels,
  dailyPoints,
  weeklyLabels,
  weeklyPoints,
}: ChildProgressChartProps) {
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if any
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const isDaily = tab === 'daily';
    const labels = isDaily ? dailyLabels : weeklyLabels;
    const data = isDaily ? dailyPoints : weeklyPoints;
    const borderColor = isDaily ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)'; // Emerald vs Blue
    const backgroundColor = isDaily ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)';

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Poin Kumulatif',
            data: data,
            borderColor: borderColor,
            backgroundColor: backgroundColor,
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: borderColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return ` ${context.parsed.y} Poin`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              precision: 0,
              font: { weight: 'bold', size: 10 },
            },
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { weight: 'bold', size: 10 },
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
  }, [tab, dailyLabels, dailyPoints, weeklyLabels, weeklyPoints]);

  return (
    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Perkembangan Poin</h4>
        <div className="flex gap-1.5 p-1 bg-slate-200 rounded-xl text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setTab('daily')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              tab === 'daily' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Harian
          </button>
          <button
            type="button"
            onClick={() => setTab('weekly')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              tab === 'weekly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Mingguan
          </button>
        </div>
      </div>

      <div className="relative h-48 w-full">
        <canvas ref={chartRef} id={`chart-${studentId}`}></canvas>
      </div>
    </div>
  );
}
