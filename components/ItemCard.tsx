'use client';

import React from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Edit3, Trash2, Calendar, MapPin, Tag, AlertCircle } from 'lucide-react';
import { FridgeItem } from '@/lib/types';
import { getExpiryStatusInfo, formatThaiDate } from '@/lib/date-utils';
import { CATEGORIES, COMPARTMENTS } from '@/lib/sample-data';

interface ItemCardProps {
  item: FridgeItem;
  onEdit: (item: FridgeItem) => void;
  onDelete: (itemId: string, imagePath?: string) => void;
  onToggleConsumed: (itemId: string, currentConsumed: boolean) => void;
}

export function ItemCard({
  item,
  onEdit,
  onDelete,
  onToggleConsumed,
}: ItemCardProps) {
  const statusInfo = getExpiryStatusInfo(item.expirationDate);
  const category = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[CATEGORIES.length - 1];
  const compartment = COMPARTMENTS.find((c) => c.id === item.compartment) || COMPARTMENTS[0];

  const handleConsumeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.consumed) {
      // Trigger festive celebratory confetti
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x, y },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#fef08a'],
      });
    }
    onToggleConsumed(item.id, item.consumed);
  };

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl glass-card p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        item.consumed ? 'opacity-60 grayscale-[40%]' : ''
      } ${statusInfo.borderClass} ${!item.consumed && (statusInfo.stage === 'today' || statusInfo.stage === 'expired') ? statusInfo.glowClass : ''}`}
    >
      {/* Top Row: Category & Expiry Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/90 px-2.5 py-1 text-xs font-medium text-slate-300 border border-white/5">
          <span>{category.emoji}</span>
          <span className="truncate max-w-[110px]">{category.nameTh.split(' ')[0]}</span>
        </div>

        {/* Expiry Badge */}
        {!item.consumed ? (
          <div
            className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusInfo.badgeClass}`}
          >
            <span>{statusInfo.emoji}</span>
            <span>{statusInfo.shortLabelTh}</span>
          </div>
        ) : (
          <div className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            ✅ ทานแล้ว
          </div>
        )}
      </div>

      {/* Center Row: Item Image + Details */}
      <div className="mt-3 flex gap-3.5">
        {/* Image / Emoji Box */}
        <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-950/60 border border-white/10">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-3xl">
              <span>{category.emoji}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div>
            <h3 className={`text-base font-bold text-white truncate ${item.consumed ? 'line-through text-slate-400' : ''}`} title={item.name}>
              {item.name}
            </h3>
            
            {/* Quantity & Compartment */}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-brand-300">
                {item.quantity} {item.unit}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span>{compartment.emoji}</span>
                <span>{compartment.nameTh.split(' ')[0]}</span>
              </span>
            </div>
          </div>

          {/* Expiration Date Info */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>หมดอายุ:</span>
            <span className={`font-semibold ${statusInfo.stage === 'today' ? 'text-rose-400 underline font-bold' : 'text-slate-200'}`}>
              {formatThaiDate(item.expirationDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes (if any) */}
      {item.notes && (
        <div className="mt-2.5 rounded-lg bg-slate-900/50 px-2.5 py-1.5 text-[11px] text-slate-400 border border-white/5 truncate">
          📝 {item.notes}
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="mt-3.5 flex items-center justify-between border-t border-white/5 pt-2.5">
        <button
          onClick={handleConsumeClick}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            item.consumed
              ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-glow-emerald hover:from-brand-500 hover:to-brand-400'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{item.consumed ? 'นำกลับมา' : 'ทานแล้ว'}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="แก้ไขรายการ"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(item.id, item.imageStoragePath)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
            title="ลบรายการ"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
