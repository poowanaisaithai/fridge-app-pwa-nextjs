'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  ScanText,
  Upload,
  Sparkles,
  Calendar,
  Layers,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { FridgeItem, FoodCategory, Compartment, CategoryMeta } from '@/lib/types';
import { CATEGORIES, COMPARTMENTS } from '@/lib/sample-data';
import { compressImage, formatBytes, CompressionResult } from '@/lib/image-compression';
import { recognizeImageOCR } from '@/lib/ocr-service';
import { getTodayString, addDaysToToday } from '@/lib/date-utils';
import { saveFridgeItem, uploadItemImageToStorage } from '@/lib/firebase';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemSaved: () => void;
  editItem?: FridgeItem | null;
  categories?: CategoryMeta[];
}

export function AddItemModal({
  isOpen,
  onClose,
  onItemSaved,
  editItem,
  categories = CATEGORIES,
}: AddItemModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('dairy');
  const [compartment, setCompartment] = useState<Compartment>('fridge');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('ชิ้น');
  const [purchaseDate, setPurchaseDate] = useState(getTodayString());
  const [expirationDate, setExpirationDate] = useState(addDaysToToday(7));
  const [notes, setNotes] = useState('');

  // Image & Compression State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');
  const [existingStoragePath, setExistingStoragePath] = useState<string>('');

  // OCR Vision State
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<{ percent: number; status: string }>({
    percent: 0,
    status: '',
  });
  const [ocrDetectedInfo, setOcrDetectedInfo] = useState<{
    name?: string;
    date?: string;
  } | null>(null);

  // Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setCategory(editItem.category);
      setCompartment(editItem.compartment);
      setQuantity(editItem.quantity);
      setUnit(editItem.unit || 'ชิ้น');
      setPurchaseDate(editItem.purchaseDate || getTodayString());
      setExpirationDate(editItem.expirationDate || addDaysToToday(7));
      setNotes(editItem.notes || '');
      setExistingImageUrl(editItem.imageUrl || '');
      setExistingStoragePath(editItem.imageStoragePath || '');
      setImagePreview(editItem.imageUrl || '');
    } else {
      resetForm();
    }
  }, [editItem, isOpen]);

  const resetForm = () => {
    setName('');
    setCategory('dairy');
    setCompartment('fridge');
    setQuantity(1);
    setUnit('ชิ้น');
    setPurchaseDate(getTodayString());
    setExpirationDate(addDaysToToday(7));
    setNotes('');
    setImageFile(null);
    setImagePreview('');
    setCompressionInfo(null);
    setExistingImageUrl('');
    setExistingStoragePath('');
    setIsOcrScanning(false);
    setOcrDetectedInfo(null);
    setErrorMessage('');
  };

  if (!isOpen) return null;

  // Handle Image Selection with Automatic Client-Side Compression
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage('');
      const compressed = await compressImage(file, 1024, 0.75);
      setImageFile(compressed.file);
      setImagePreview(compressed.previewUrl);
      setCompressionInfo(compressed);

      // Auto-trigger Vision OCR scan if user hasn't typed a name yet
      if (!name) {
        runVisionOCR(compressed.file);
      }
    } catch (err: any) {
      console.error('Image compression failed:', err);
      setErrorMessage('บีบอัดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Run 100% Free Client-Side Vision OCR (Tesseract.js)
  const runVisionOCR = async (fileToScan?: File) => {
    const targetFile = fileToScan || imageFile;
    if (!targetFile && !imagePreview) {
      setErrorMessage('กรุณาเลือกหรือถ่ายภาพสินค้าก่อนทำการสแกน OCR');
      return;
    }

    setIsOcrScanning(true);
    setErrorMessage('');
    setOcrDetectedInfo(null);

    try {
      const scanTarget = targetFile || imagePreview;
      const result = await recognizeImageOCR(scanTarget, (percent, status) => {
        setOcrProgress({ percent, status });
      });

      const detected: { name?: string; date?: string } = {};

      if (result.extractedName && !name) {
        setName(result.extractedName);
        detected.name = result.extractedName;
      }

      if (result.extractedDate) {
        setExpirationDate(result.extractedDate);
        detected.date = result.extractedDate;
      }

      setOcrDetectedInfo(detected);
    } catch (err: any) {
      console.error('OCR scan failed:', err);
      setErrorMessage('ระบบไม่สามารถอ่านข้อความจากรูปนี้ได้ชัดเจน กรุณากรอกข้อมูลเอง');
    } finally {
      setIsOcrScanning(false);
    }
  };

  // Quick Preset Date Helpers
  const handleSetPresetDate = (days: number) => {
    setExpirationDate(addDaysToToday(days));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('กรุณาระบุชื่ออาหาร');
      return;
    }
    if (!expirationDate) {
      setErrorMessage('กรุณาระบุวันหมดอายุ');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const itemId = editItem?.id || `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      let finalImageUrl = existingImageUrl;
      let finalStoragePath = existingStoragePath;

      // Upload compressed image if a new one was selected
      if (imageFile) {
        const uploadRes = await uploadItemImageToStorage(imageFile, itemId);
        finalImageUrl = uploadRes.downloadUrl;
        finalStoragePath = uploadRes.storagePath;
      }

      const itemData: FridgeItem = {
        id: itemId,
        name: name.trim(),
        category,
        compartment,
        quantity: Number(quantity) || 1,
        unit: unit.trim() || 'ชิ้น',
        purchaseDate,
        expirationDate,
        imageUrl: finalImageUrl || undefined,
        imageStoragePath: finalStoragePath || undefined,
        notes: notes.trim() || undefined,
        consumed: editItem?.consumed || false,
        consumedAt: editItem?.consumedAt,
        createdAt: editItem?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveFridgeItem(itemData);
      onItemSaved();
      onClose();
    } catch (err: any) {
      console.error('Save item failed:', err);
      setErrorMessage(err?.message || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl glass-panel border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {editItem ? 'แก้ไขรายการอาหาร' : 'เพิ่มอาหารเข้าตู้เย็น'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="max-h-[82vh] overflow-y-auto p-5 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/30">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Image Upload & Vision OCR Section */}
          <div className="rounded-2xl bg-slate-900/60 p-3.5 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-brand-400" />
                รูปถ่ายสินค้า & Vision OCR
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Client-Side OCR ฟรี 100%
              </span>
            </div>

            {/* Image Preview / Picker Box */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative flex h-28 w-28 flex-shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/70 hover:border-brand-500/50 hover:bg-slate-900 transition group"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center p-2 text-center text-slate-400 group-hover:text-brand-300">
                    <Camera className="h-6 w-6 mb-1" />
                    <span className="text-[10px] font-medium leading-tight">ถ่าย / เลือกภาพ</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {/* OCR Action Buttons & Info */}
              <div className="flex flex-1 flex-col justify-between w-full space-y-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-700 hover:bg-slate-700 transition"
                  >
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                    <span>{imagePreview ? 'เปลี่ยนรูป' : 'เลือกรูปภาพ'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={!imagePreview || isOcrScanning}
                    onClick={() => runVisionOCR()}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-glow-emerald transition ${
                      imagePreview && !isOcrScanning
                        ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {isOcrScanning ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ScanText className="h-3.5 w-3.5 text-emerald-200" />
                    )}
                    <span>{isOcrScanning ? 'กำลังสแกน...' : 'สแกน Vision OCR'}</span>
                  </button>
                </div>

                {/* Compression Savings Info */}
                {compressionInfo && (
                  <div className="text-[11px] text-emerald-400 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                    ⚡ บีบอัดรูปภาพ: {formatBytes(compressionInfo.originalSize)} ➔{' '}
                    <span className="font-bold">{formatBytes(compressionInfo.compressedSize)}</span>{' '}
                    (ประหยัด {compressionInfo.savedPercent}%)
                  </div>
                )}

                {/* OCR Detection Feedback */}
                {ocrDetectedInfo && (
                  <div className="text-[11px] text-brand-300 bg-brand-950/40 p-2 rounded-lg border border-brand-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-400 flex-shrink-0" />
                    <span>
                      สแกนสำเร็จ: {ocrDetectedInfo.name ? `ชื่อ "${ocrDetectedInfo.name}"` : ''}
                      {ocrDetectedInfo.name && ocrDetectedInfo.date ? ' | ' : ''}
                      {ocrDetectedInfo.date ? `วันหมดอายุ ${ocrDetectedInfo.date}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* OCR Live Progress Bar */}
            {isOcrScanning && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>{ocrProgress.status || 'กำลังประมวลผล WebAssembly...'}</span>
                  <span>{ocrProgress.percent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-emerald-300 transition-all duration-300"
                    style={{ width: `${ocrProgress.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Item Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              ชื่ออาหาร / สินค้า <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น นมสดเมจิ 830ml, ไข่ไก่เบอร์ 2"
              className="w-full rounded-xl glass-input px-3.5 py-2.5 text-sm"
            />
          </div>

          {/* 3. Compartment Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">ช่องจัดเก็บในตู้เย็น</label>
            <div className="grid grid-cols-3 gap-2">
              {COMPARTMENTS.map((comp) => {
                const isSelected = compartment === comp.id;
                return (
                  <button
                    type="button"
                    key={comp.id}
                    onClick={() => setCompartment(comp.id)}
                    className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-center transition border ${
                      isSelected
                        ? 'bg-brand-500/20 text-brand-300 border-brand-500/50 shadow-glow-emerald'
                        : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xl mb-1">{comp.emoji}</span>
                    <span className="text-xs font-medium">{comp.nameTh.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Category Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">หมวดหมู่</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs transition border ${
                      isSelected
                        ? 'bg-brand-500/20 text-brand-300 border-brand-500/50 font-semibold'
                        : 'bg-slate-900/50 text-slate-400 border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-sm">{cat.emoji}</span>
                    <span className="truncate">{cat.nameTh.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Expiration Date & Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                วันหมดอายุ (Expiry Date) <span className="text-rose-400">*</span>
              </label>
            </div>

            <input
              type="date"
              required
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full rounded-xl glass-input px-3.5 py-2.5 text-sm"
            />

            {/* Quick Expiry Date Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400">เลือกเร็ว:</span>
              <button
                type="button"
                onClick={() => handleSetPresetDate(0)}
                className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[11px] font-semibold text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
              >
                🚨 วันนี้
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetDate(3)}
                className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
              >
                ⏳ +3 วัน
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetDate(7)}
                className="rounded-md bg-yellow-500/20 px-2 py-0.5 text-[11px] font-semibold text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30"
              >
                📅 +7 วัน
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetDate(14)}
                className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700 hover:bg-slate-700"
              >
                +14 วัน
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetDate(30)}
                className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700 hover:bg-slate-700"
              >
                +1 เดือน
              </button>
            </div>
          </div>

          {/* 6. Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">จำนวน</label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-xl glass-input px-3.5 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">หน่วยนับ</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="ชิ้น, ขวด, กล่อง, กรัม"
                className="w-full rounded-xl glass-input px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          {/* 7. Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">บันทึกเพิ่มเติม (ไม่บังคับ)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น เปิดแล้ว, สำหรับทำมื้อเย็น, ซื้อจากตลาด"
              className="w-full rounded-xl glass-input px-3.5 py-2 text-sm"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-xs font-semibold text-white shadow-glow-emerald hover:from-brand-500 hover:to-brand-400 disabled:opacity-50 transition"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isSaving ? 'กำลังบันทึก...' : editItem ? 'บันทึกการแก้ไข' : 'เพิ่มอาหาร'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
