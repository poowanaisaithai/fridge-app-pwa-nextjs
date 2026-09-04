import { ExpiryStage, ExpiryStatusInfo } from './types';

/**
 * Get difference in whole days between today (start of day) and target date
 */
export function getDaysRemaining(expirationDateStr: string): number {
  if (!expirationDateStr) return 999;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = expirationDateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Categorize into 5 stages:
 * - 'expired': < 0 days (แดง)
 * - 'today': === 0 days (แดงเข้ม/ชมพูสะท้อนแสง)
 * - 'urgent_3d': 1..3 days (ส้ม)
 * - 'warning_7d': 4..7 days (เหลือง)
 * - 'fresh': > 7 days (เขียวมรกต)
 */
export function getExpiryStage(daysRemaining: number): ExpiryStage {
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining === 0) return 'today';
  if (daysRemaining <= 3) return 'urgent_3d';
  if (daysRemaining <= 7) return 'warning_7d';
  return 'fresh';
}

/**
 * Returns comprehensive visual styling and Thai labels for any item's expiry status
 */
export function getExpiryStatusInfo(expirationDateStr: string): ExpiryStatusInfo {
  const daysRemaining = getDaysRemaining(expirationDateStr);
  const stage = getExpiryStage(daysRemaining);

  switch (stage) {
    case 'expired':
      return {
        stage,
        daysRemaining,
        labelTh: `หมดอายุแล้ว (เลยมา ${Math.abs(daysRemaining)} วัน)`,
        shortLabelTh: `หมดอายุแล้ว`,
        badgeClass: 'bg-red-500/20 text-red-400 border border-red-500/40',
        glowClass: 'shadow-glow-rose',
        borderClass: 'border-red-500/50 hover:border-red-400',
        emoji: '🔴',
      };
    case 'today':
      return {
        stage,
        daysRemaining: 0,
        labelTh: '🚨 หมดอายุวันนี้! (วันสุดท้าย)',
        shortLabelTh: 'หมดอายุวันนี้!',
        badgeClass: 'bg-rose-500/30 text-rose-300 border border-rose-400 animate-pulse',
        glowClass: 'shadow-glow-rose',
        borderClass: 'border-rose-500 hover:border-rose-400',
        emoji: '🚨',
      };
    case 'urgent_3d':
      return {
        stage,
        daysRemaining,
        labelTh: `⏳ ด่วน! เหลืออีก ${daysRemaining} วัน`,
        shortLabelTh: `เหลืออีก ${daysRemaining} วัน`,
        badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
        glowClass: 'shadow-glow-amber',
        borderClass: 'border-amber-500/40 hover:border-amber-400',
        emoji: '⏳',
      };
    case 'warning_7d':
      return {
        stage,
        daysRemaining,
        labelTh: `📅 เตือนล่วงหน้า (อีก ${daysRemaining} วัน)`,
        shortLabelTh: `อีก ${daysRemaining} วัน`,
        badgeClass: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
        glowClass: 'shadow-[0_0_15px_-3px_rgba(234,179,8,0.25)]',
        borderClass: 'border-yellow-500/30 hover:border-yellow-400',
        emoji: '📅',
      };
    case 'fresh':
    default:
      return {
        stage: 'fresh',
        daysRemaining,
        labelTh: `✅ สดใหม่ (เหลืออีก ${daysRemaining} วัน)`,
        shortLabelTh: `อีก ${daysRemaining} วัน`,
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
        glowClass: 'shadow-glow-emerald',
        borderClass: 'border-emerald-500/30 hover:border-emerald-400',
        emoji: '✅',
      };
  }
}

/**
 * Format ISO date string into Thai localized string (e.g. 15 พ.ย. 2026)
 */
export function formatThaiDate(dateStr: string): string {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-').map(Number);
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  return `${day} ${thaiMonths[month - 1] || ''} ${year + 543}`;
}

/**
 * Format today's date in YYYY-MM-DD
 */
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to today and return YYYY-MM-DD
 */
export function addDaysToToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
