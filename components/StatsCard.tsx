'use client';

import React from 'react';
import { AlertTriangle, Clock, Calendar, Layers } from 'lucide-react';

interface StatsCardProps {
  totalCount: number;
  todayCount: number;
  urgent3dCount: number;
  warning7dCount: number;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
}

export function StatsCard({
  totalCount,
  todayCount,
  urgent3dCount,
  warning7dCount,
  selectedFilter,
  onSelectFilter,
}: StatsCardProps) {
  const cards = [
    {
      id: 'all',
      title: 'ของทั้งหมด',
      subtitle: 'ในตู้เย็น & ตู้กับข้าว',
      count: totalCount,
      icon: Layers,
      color: 'from-slate-600/30 to-slate-800/50',
      border: selectedFilter === 'all' ? 'border-brand-400 ring-2 ring-brand-500/20' : 'border-white/10',
      textAccent: 'text-slate-200',
      badgeColor: 'bg-slate-700/50 text-slate-300',
    },
    {
      id: 'today',
      title: 'หมดอายุวันนี้!',
      subtitle: '🚨 วันสุดท้าย รีบทานเลย',
      count: todayCount,
      icon: AlertTriangle,
      color: 'from-rose-950/40 to-rose-900/20',
      border: selectedFilter === 'today' ? 'border-rose-400 ring-2 ring-rose-500/30' : 'border-rose-500/30',
      textAccent: 'text-rose-400',
      badgeColor: todayCount > 0 ? 'bg-rose-500/30 text-rose-300 animate-pulse' : 'bg-rose-950/30 text-rose-400',
    },
    {
      id: 'urgent_3d',
      title: 'ภายใน 3 วัน',
      subtitle: '⏳ เร่งด่วน ควรเริ่มทาน',
      count: urgent3dCount,
      icon: Clock,
      color: 'from-amber-950/40 to-amber-900/20',
      border: selectedFilter === 'urgent_3d' ? 'border-amber-400 ring-2 ring-amber-500/30' : 'border-amber-500/30',
      textAccent: 'text-amber-400',
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    {
      id: 'warning_7d',
      title: 'ภายใน 7 วัน',
      subtitle: '📅 เตือนล่วงหน้า 1 สัปดาห์',
      count: warning7dCount,
      icon: Calendar,
      color: 'from-yellow-950/30 to-yellow-900/10',
      border: selectedFilter === 'warning_7d' ? 'border-yellow-400 ring-2 ring-yellow-500/30' : 'border-yellow-500/30',
      textAccent: 'text-yellow-400',
      badgeColor: 'bg-yellow-500/20 text-yellow-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const isSelected = selectedFilter === c.id;

        return (
          <button
            key={c.id}
            onClick={() => onSelectFilter(isSelected && c.id !== 'all' ? 'all' : c.id)}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} p-4 text-left backdrop-blur-md border ${c.border} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
          >
            <div className="flex items-start justify-between">
              <span className={`text-xs font-medium ${c.textAccent}`}>{c.title}</span>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.badgeColor}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {c.count}
              </span>
              <span className="text-[11px] text-slate-400 truncate max-w-[100px]">
                {c.subtitle.split(' ')[0]}
              </span>
            </div>

            {isSelected && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-emerald-300"></div>
            )}
          </button>
        );
      })}
    </div>
  );
}
