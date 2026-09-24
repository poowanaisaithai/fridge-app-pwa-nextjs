'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
  Bell,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  UtensilsCrossed,
  Filter,
} from 'lucide-react';
import { FridgeItem, Compartment, FoodCategory } from '@/lib/types';
import {
  fetchFridgeItems,
  removeFridgeItem,
  markItemConsumed,
  isFirebaseConfigured,
} from '@/lib/firebase';
import { getDaysRemaining } from '@/lib/date-utils';
import { CATEGORIES, COMPARTMENTS, INITIAL_SAMPLE_ITEMS } from '@/lib/sample-data';
import { registerServiceWorker, getCurrentPushSubscription } from '@/lib/push-notifications';

import { Navbar } from '@/components/Navbar';
import { StatsCard } from '@/components/StatsCard';
import { ItemCard } from '@/components/ItemCard';
import { AddItemModal } from '@/components/AddItemModal';
import { PushManager } from '@/components/PushManager';
import { SetupGuideModal } from '@/components/SetupGuideModal';
import { InstallPwaPrompt } from '@/components/InstallPwaPrompt';
import { AdminDashboardModal } from '@/components/AdminDashboardModal';

export default function DashboardPage() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompartment, setSelectedCompartment] = useState<Compartment | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, today, urgent_3d, warning_7d, expired, fresh, consumed
  const [sortBy, setSortBy] = useState<'expiry_asc' | 'expiry_desc' | 'name' | 'created'>('expiry_asc');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FridgeItem | null>(null);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isPushActive, setIsPushActive] = useState(false);

  // Initialize and load items
  useEffect(() => {
    loadItems();
    initServiceWorkerAndPush();
  }, []);

  const initServiceWorkerAndPush = async () => {
    await registerServiceWorker();
    const sub = await getCurrentPushSubscription();
    setIsPushActive(Boolean(sub));
  };

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await fetchFridgeItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Item Handlers
  const handleEditItem = (item: FridgeItem) => {
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleDeleteItem = async (itemId: string, imagePath?: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
      await removeFridgeItem(itemId, imagePath);
      loadItems();
    }
  };

  const handleToggleConsumed = async (itemId: string, currentConsumed: boolean) => {
    await markItemConsumed(itemId, !currentConsumed);
    loadItems();
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleResetSampleData = () => {
    localStorage.removeItem('fresh_fridge_items_v1');
    loadItems();
  };

  // Compute Stats for 4 Cards
  const stats = useMemo(() => {
    const unconsumed = items.filter((i) => !i.consumed);
    let todayCount = 0;
    let urgent3dCount = 0;
    let warning7dCount = 0;

    unconsumed.forEach((item) => {
      const days = getDaysRemaining(item.expirationDate);
      if (days === 0) todayCount++;
      else if (days > 0 && days <= 3) urgent3dCount++;
      else if (days > 3 && days <= 7) warning7dCount++;
    });

    return {
      total: unconsumed.length,
      todayCount,
      urgent3dCount,
      warning7dCount,
    };
  }, [items]);

  // Filtered and Sorted Items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchNotes = item.notes?.toLowerCase().includes(q);
          if (!matchName && !matchNotes) return false;
        }

        // Compartment filter
        if (selectedCompartment !== 'all' && item.compartment !== selectedCompartment) {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }

        // Status Filter
        const days = getDaysRemaining(item.expirationDate);
        if (statusFilter === 'today') {
          return !item.consumed && days === 0;
        }
        if (statusFilter === 'urgent_3d') {
          return !item.consumed && days > 0 && days <= 3;
        }
        if (statusFilter === 'warning_7d') {
          return !item.consumed && days > 3 && days <= 7;
        }
        if (statusFilter === 'expired') {
          return !item.consumed && days < 0;
        }
        if (statusFilter === 'fresh') {
          return !item.consumed && days > 7;
        }
        if (statusFilter === 'consumed') {
          return item.consumed;
        }

        // Default 'all': don't show consumed items unless 'consumed' filter is chosen
        if (statusFilter === 'all') {
          return !item.consumed;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'expiry_asc') {
          return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
        }
        if (sortBy === 'expiry_desc') {
          return new Date(b.expirationDate).getTime() - new Date(a.expirationDate).getTime();
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name, 'th');
        }
        if (sortBy === 'created') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [items, searchQuery, selectedCompartment, selectedCategory, statusFilter, sortBy]);

  return (
    <div className="min-h-screen pb-24">
      {/* Top Navbar */}
      <Navbar
        onOpenPushManager={() => setIsPushModalOpen(true)}
        onOpenSetupGuide={() => setIsSetupModalOpen(true)}
        onOpenAdminDashboard={() => setIsAdminModalOpen(true)}
        isPushActive={isPushActive}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 space-y-6">
        {/* Firebase Config Notice (If in local demo mode) */}
        {!isFirebaseConfigured && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-500/10 p-3.5 border border-brand-500/30 text-xs text-brand-300">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-400 flex-shrink-0" />
              <span>
                <strong>โหมดสาธิต (Local Demo Mode):</strong> ข้อมูลบันทึกในเครื่อง สามารถกด "คู่มือตั้งค่า" เพื่อเชื่อมต่อ Firebase (us-central1) และเปิดรับการแจ้งเตือนจริงได้
              </span>
            </div>
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="flex-shrink-0 rounded-lg bg-brand-500/20 px-3 py-1 font-semibold text-brand-300 border border-brand-500/40 hover:bg-brand-500/30 transition"
            >
              ดูวิธีตั้งค่า
            </button>
          </div>
        )}

        {/* 1. Summary Statistics Cards */}
        <StatsCard
          totalCount={stats.total}
          todayCount={stats.todayCount}
          urgent3dCount={stats.urgent3dCount}
          warning7dCount={stats.warning7dCount}
          selectedFilter={statusFilter}
          onSelectFilter={(f) => setStatusFilter(f)}
        />

        {/* 2. Compartment Selector Tabs (Fridge, Freezer, Pantry) */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCompartment('all')}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition flex-shrink-0 border ${
              selectedCompartment === 'all'
                ? 'bg-brand-500 text-white border-brand-400 shadow-glow-emerald'
                : 'bg-slate-900/60 text-slate-300 border-white/5 hover:bg-slate-800'
            }`}
          >
            <span>🏠 ทั้งหมด</span>
          </button>

          {COMPARTMENTS.map((comp) => {
            const isSelected = selectedCompartment === comp.id;
            return (
              <button
                key={comp.id}
                onClick={() => setSelectedCompartment(comp.id)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition flex-shrink-0 border ${
                  isSelected
                    ? 'bg-brand-500 text-white border-brand-400 shadow-glow-emerald'
                    : 'bg-slate-900/60 text-slate-300 border-white/5 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">{comp.emoji}</span>
                <span>{comp.nameTh.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่ออาหาร เช่น นม, ผักสลัด, อกไก่..."
              className="w-full rounded-2xl glass-input pl-10 pr-4 py-2.5 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Sort & Status Filters */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="rounded-2xl glass-input px-3 py-2.5 text-xs text-slate-300 font-medium"
            >
              <option value="expiry_asc">⌛ หมดอายุใกล้สุดก่อน</option>
              <option value="expiry_desc">⏳ หมดอายุไกลสุดก่อน</option>
              <option value="name">🔤 เรียงตามชื่อ ก-ฮ</option>
              <option value="created">🆕 วันที่เพิ่มล่าสุด</option>
            </select>

            {/* Add Button */}
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-glow-emerald hover:from-brand-500 hover:to-brand-400 transition"
            >
              <Plus className="h-4 w-4" />
              <span>เพิ่มของ</span>
            </button>
          </div>
        </div>

        {/* 4. Status Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-xl px-3 py-1.5 font-medium transition flex-shrink-0 border ${
              statusFilter === 'all'
                ? 'bg-slate-700 text-white border-slate-500'
                : 'bg-slate-900/40 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            ของที่ยังไม่ทาน ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('today')}
            className={`rounded-xl px-3 py-1.5 font-semibold transition flex-shrink-0 border ${
              statusFilter === 'today'
                ? 'bg-rose-500/30 text-rose-300 border-rose-500/50'
                : 'bg-slate-900/40 text-rose-400 border-white/5 hover:bg-rose-500/10'
            }`}
          >
            🚨 วันสุดท้าย ({stats.todayCount})
          </button>
          <button
            onClick={() => setStatusFilter('urgent_3d')}
            className={`rounded-xl px-3 py-1.5 font-semibold transition flex-shrink-0 border ${
              statusFilter === 'urgent_3d'
                ? 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                : 'bg-slate-900/40 text-amber-400 border-white/5 hover:bg-amber-500/10'
            }`}
          >
            ⏳ ใน 3 วัน ({stats.urgent3dCount})
          </button>
          <button
            onClick={() => setStatusFilter('warning_7d')}
            className={`rounded-xl px-3 py-1.5 font-semibold transition flex-shrink-0 border ${
              statusFilter === 'warning_7d'
                ? 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50'
                : 'bg-slate-900/40 text-yellow-400 border-white/5 hover:bg-yellow-500/10'
            }`}
          >
            📅 ใน 7 วัน ({stats.warning7dCount})
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`rounded-xl px-3 py-1.5 font-medium transition flex-shrink-0 border ${
              statusFilter === 'expired'
                ? 'bg-red-500/30 text-red-300 border-red-500/50'
                : 'bg-slate-900/40 text-slate-400 border-white/5 hover:text-red-400'
            }`}
          >
            🔴 หมดอายุแล้ว
          </button>
          <button
            onClick={() => setStatusFilter('fresh')}
            className={`rounded-xl px-3 py-1.5 font-medium transition flex-shrink-0 border ${
              statusFilter === 'fresh'
                ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-900/40 text-slate-400 border-white/5 hover:text-emerald-300'
            }`}
          >
            🟢 สดใหม่ (&gt; 7 วัน)
          </button>
          <button
            onClick={() => setStatusFilter('consumed')}
            className={`rounded-xl px-3 py-1.5 font-medium transition flex-shrink-0 border ${
              statusFilter === 'consumed'
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-600/50'
                : 'bg-slate-900/40 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            ✅ ทานแล้ว
          </button>
        </div>

        {/* 5. Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-xl px-3 py-1 text-xs transition flex-shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 font-semibold'
                : 'bg-slate-900/40 text-slate-400 border border-white/5 hover:text-slate-200'
            }`}
          >
            ทุกหมวด
          </button>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs transition flex-shrink-0 ${
                  isSelected
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 font-semibold'
                    : 'bg-slate-900/40 text-slate-400 border border-white/5 hover:text-slate-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.nameTh.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* 6. Item List / Cards Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-400 mb-3" />
            <p className="text-sm">กำลังโหลดรายการอาหารในตู้เย็น...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onToggleConsumed={handleToggleConsumed}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-3xl glass-panel p-10 text-center border border-white/5 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-3xl">
              🥗
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ไม่พบรายการอาหารในเงื่อนไขนี้</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                คุณสามารถเพิ่มรายการอาหารใหม่พร้อมถ่ายรูปและสแกนวันหมดอายุด้วย Vision OCR ได้ทันที
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2 text-xs font-bold text-white shadow-glow-emerald hover:from-brand-500 hover:to-brand-400 transition"
              >
                <Plus className="h-4 w-4" />
                <span>เพิ่มรายการอาหาร</span>
              </button>
              <button
                onClick={handleResetSampleData}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
              >
                โหลดตัวอย่างเริ่มต้น
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Add Item FAB Button (Mobile) */}
      <button
        onClick={handleOpenAddModal}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-glow-emerald hover:scale-105 active:scale-95 transition sm:hidden"
        title="เพิ่มของเข้าตู้เย็น"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* Add / Edit Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemSaved={loadItems}
        editItem={editingItem}
      />

      {/* Push Notification Manager Modal */}
      <PushManager
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
        onStatusChange={(active) => setIsPushActive(active)}
      />

      {/* Setup Guide Modal */}
      <SetupGuideModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
      />

      {/* Admin Dashboard Back-Office Modal */}
      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        items={items}
      />

      {/* PWA Install Banner */}
      <InstallPwaPrompt />
    </div>
  );
}
