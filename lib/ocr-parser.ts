import { OCRScanResult } from './types';

const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  มค: 1, กพ: 2, มีค: 3, เมย: 4, พค: 5, มิย: 6,
  กค: 7, สค: 8, กย: 9, ตค: 10, พย: 11, ธค: 12,
};

/**
 * Normalize year: converts 2-digit years and Thai Buddhist era (BE) to 4-digit CE
 */
function normalizeYear(yearNum: number): number {
  const currentYear = new Date().getFullYear();
  // If Thai Buddhist era (e.g. 2567, 2568, 2569, 2570)
  if (yearNum >= 2500 && yearNum <= 2600) {
    return yearNum - 543;
  }
  // If 2-digit Thai Buddhist era (e.g. 67, 68, 69, 70)
  if (yearNum >= 60 && yearNum <= 80) {
    return 2500 + yearNum - 543;
  }
  // If 2-digit CE (e.g. 24, 25, 26, 27, 28, 29, 30)
  if (yearNum >= 20 && yearNum <= 50) {
    return 2000 + yearNum;
  }
  // Already 4-digit CE
  if (yearNum >= 2000 && yearNum <= 2100) {
    return yearNum;
  }
  return currentYear;
}

/**
 * Formats day, month, year into YYYY-MM-DD
 */
function formatIsoDate(day: number, month: number, year: number): string | null {
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const y = normalizeYear(year);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Smart OCR Parser to extract Expiration Date and Food Name from raw text
 */
export function parseFoodLabel(rawText: string, confidence: number = 80): OCRScanResult {
  if (!rawText || !rawText.trim()) {
    return { rawText: '', confidence: 0 };
  }

  const cleaned = rawText.replace(/\r\n/g, '\n');
  const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);

  let extractedDate: string | undefined;
  let datePatternMatched: string | undefined;

  // 1. Check for Month name formats (e.g. 24 NOV 2026, EXP: 15-DEC-26)
  const monthNameRegex = /(?:exp|expiry|bb|bbd|best\s*before|use\s*by)?[:\s\.]*(\d{1,2})[\s\.\-\/]+([a-zA-Z]{3,4})[\s\.\-\/]+(\d{2,4})/i;
  const monthMatch = cleaned.match(monthNameRegex);
  if (monthMatch) {
    const day = parseInt(monthMatch[1], 10);
    const monthKey = monthMatch[2].toLowerCase().substring(0, 3);
    const month = MONTH_MAP[monthKey];
    const year = parseInt(monthMatch[3], 10);
    if (month) {
      const iso = formatIsoDate(day, month, year);
      if (iso) {
        extractedDate = iso;
        datePatternMatched = monthMatch[0];
      }
    }
  }

  // 2. Check for Prefix-based Expiration Patterns (EXP, BB, BBD, BEST BEFORE, USE BY, หมดอายุ, ควรบริโภคก่อน)
  if (!extractedDate) {
    const expPrefixRegex = /(?:exp(?:iry)?|b\.?b\.?d?|best\s*before|use\s*by|หมดอายุ|ควรบริโภคก่อน)[:\s\.\-]*(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/i;
    const prefixMatch = cleaned.match(expPrefixRegex);
    if (prefixMatch) {
      const p1 = parseInt(prefixMatch[1], 10);
      const p2 = parseInt(prefixMatch[2], 10);
      const p3 = parseInt(prefixMatch[3], 10);
      
      // Standard Thai/UK format is DD/MM/YYYY
      const iso = formatIsoDate(p1, p2, p3);
      if (iso) {
        extractedDate = iso;
        datePatternMatched = prefixMatch[0];
      }
    }
  }

  // 3. Check for Standard ISO / Date Formats (YYYY/MM/DD or DD/MM/YYYY)
  if (!extractedDate) {
    // YYYY-MM-DD
    const isoRegex = /\b(20\d{2}|25\d{2})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})\b/;
    const isoMatch = cleaned.match(isoRegex);
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      const m = parseInt(isoMatch[2], 10);
      const d = parseInt(isoMatch[3], 10);
      const iso = formatIsoDate(d, m, y);
      if (iso) {
        extractedDate = iso;
        datePatternMatched = isoMatch[0];
      }
    }
  }

  if (!extractedDate) {
    // DD/MM/YYYY or DD.MM.YY
    const dateRegex = /\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})\b/;
    const dateMatch = cleaned.match(dateRegex);
    if (dateMatch) {
      const p1 = parseInt(dateMatch[1], 10);
      const p2 = parseInt(dateMatch[2], 10);
      const p3 = parseInt(dateMatch[3], 10);
      const iso = formatIsoDate(p1, p2, p3);
      if (iso) {
        extractedDate = iso;
        datePatternMatched = dateMatch[0];
      }
    }
  }

  // 4. Extract Suggested Product Name
  // Filter out noise lines: lines containing ONLY numbers, dates, or common keywords
  const noiseKeywords = [
    'exp', 'bbd', 'mfg', 'lot', 'net wt', 'best before', 'use by',
    'ผลิต', 'หมดอายุ', 'ควรบริโภคก่อน', 'น้ำหนักสุทธิ', 'อย.', 'barcode',
    'g', 'ml', 'kg', 'cal', 'kcal'
  ];

  const candidateLines = lines.filter((line) => {
    const lower = line.toLowerCase();
    if (line.length < 3) return false;
    if (/^\d+[\/\.\-\s\d:]*$/.test(line)) return false; // purely numbers/dates
    const isOnlyNoise = noiseKeywords.some((kw) => lower === kw || lower.startsWith(kw + ':'));
    return !isOnlyNoise;
  });

  let extractedName: string | undefined;
  if (candidateLines.length > 0) {
    // Pick the most promising line (longest clean title line, max 50 chars)
    const sorted = [...candidateLines].sort((a, b) => {
      // Prefer lines with letters/Thai characters
      return b.length - a.length;
    });
    extractedName = sorted[0].replace(/^[^\w\u0E00-\u0E7F]+|[^\w\u0E00-\u0E7F]+$/g, '').slice(0, 50);
  }

  return {
    rawText: cleaned,
    extractedName: extractedName || undefined,
    extractedDate: extractedDate || undefined,
    datePatternMatched,
    confidence,
  };
}
