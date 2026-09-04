import { createWorker } from 'tesseract.js';
import { OCRScanResult } from './types';
import { parseFoodLabel } from './ocr-parser';

export type OCRProgressCallback = (percent: number, status: string) => void;

/**
 * 100% Free Client-Side Vision OCR using Tesseract.js WebAssembly.
 * Runs directly inside the browser with zero server/API costs.
 */
export async function recognizeImageOCR(
  imageSource: File | Blob | string,
  onProgress?: OCRProgressCallback
): Promise<OCRScanResult> {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    if (onProgress) onProgress(10, 'กำลังเตรียมโมเดล Vision OCR (WebAssembly)...');

    // Initialize Tesseract worker for English & Thai
    worker = await createWorker(['eng', 'tha'], 1, {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          const p = Math.round(m.progress * 80) + 15;
          onProgress(p, `กำลังอ่านตัวอักษรและฉลากอาหาร (${p}%)...`);
        }
      },
    });

    if (onProgress) onProgress(40, 'กำลังสแกนรูปภาพ...');
    const ret = await worker.recognize(imageSource);

    if (onProgress) onProgress(90, 'กำลังวิเคราะห์วันหมดอายุและชื่อสินค้า...');
    const text = ret.data.text || '';
    const confidence = ret.data.confidence || 0;

    const parsedResult = parseFoodLabel(text, confidence);

    if (onProgress) onProgress(100, 'สแกนสำเร็จ!');
    return parsedResult;
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    // Return empty result on failure without crashing
    return {
      rawText: '',
      confidence: 0,
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
