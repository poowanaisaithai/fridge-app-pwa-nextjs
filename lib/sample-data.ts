import { CategoryMeta, CompartmentMeta, FridgeItem } from './types';
import { addDaysToToday, getTodayString } from './date-utils';

export const CATEGORIES: CategoryMeta[] = [
  { id: 'dairy', nameTh: 'นม & ไข่ & ผลิตภัณฑ์นม', nameEn: 'Dairy & Eggs', emoji: '🥛', color: '#60a5fa' },
  { id: 'produce', nameTh: 'ผัก & ผลไม้สด', nameEn: 'Produce & Veggies', emoji: '🥦', color: '#4ade80' },
  { id: 'meat', nameTh: 'เนื้อสัตว์ & สัตว์ปีก', nameEn: 'Meat & Poultry', emoji: '🥩', color: '#f87171' },
  { id: 'seafood', nameTh: 'อาหารทะเล', nameEn: 'Seafood', emoji: '🐟', color: '#38bdf8' },
  { id: 'bakery', nameTh: 'เบเกอรี่ & ขนมปัง', nameEn: 'Bakery & Bread', emoji: '🍞', color: '#fbbf24' },
  { id: 'beverages', nameTh: 'เครื่องดื่ม', nameEn: 'Beverages', emoji: '🧃', color: '#c084fc' },
  { id: 'condiments', nameTh: 'เครื่องปรุง & ซอส', nameEn: 'Condiments & Sauces', emoji: '🧂', color: '#fb923c' },
  { id: 'leftovers', nameTh: 'อาหารปรุงสุก / คงค้าง', nameEn: 'Cooked Leftovers', emoji: '🍲', color: '#f472b6' },
  { id: 'snacks', nameTh: 'ขนมขบเคี้ยว', nameEn: 'Snacks & Sweets', emoji: '🍿', color: '#facc15' },
  { id: 'other', nameTh: 'อื่นๆ', nameEn: 'Other Items', emoji: '📦', color: '#94a3b8' },
];

export const COMPARTMENTS: CompartmentMeta[] = [
  { id: 'fridge', nameTh: 'ช่องแช่เย็นปกติ', nameEn: 'Refrigerator', emoji: '❄️', descTh: 'อุณหภูมิ 2°C - 4°C เหมาะสำหรับนม ผัก และอาหารพร้อมทาน' },
  { id: 'freezer', nameTh: 'ช่องแช่แข็ง (Freezer)', nameEn: 'Freezer', emoji: '🧊', descTh: 'อุณหภูมิ -18°C เหมาะสำหรับเนื้อสัตว์ อาหารแช่แข็ง' },
  { id: 'pantry', nameTh: 'ตู้กับข้าว / อุณหภูมิห้อง', nameEn: 'Pantry', emoji: '🥫', descTh: 'เก็บอาหารแห้ง เครื่องปรุง และขนม' },
];

export const INITIAL_SAMPLE_ITEMS: FridgeItem[] = [
  {
    id: 'sample-1',
    name: 'นมสดพาสเจอร์ไรส์ เมจิ 830ml',
    category: 'dairy',
    compartment: 'fridge',
    quantity: 1,
    unit: 'ขวด',
    purchaseDate: addDaysToToday(-5),
    expirationDate: getTodayString(), // 🚨 หมดอายุวันนี้ (0 วัน)
    notes: 'เปิดดื่มแล้ว เหลือครึ่งขวด',
    consumed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    name: 'อกไก่สดอนามัย S-Pure',
    category: 'meat',
    compartment: 'fridge',
    quantity: 500,
    unit: 'กรัม',
    purchaseDate: addDaysToToday(-2),
    expirationDate: addDaysToToday(2), // ⏳ เหลืออีก 2 วัน (ช่วงเตือน 3 วัน)
    notes: 'เตรียมหมักทำสเต๊กมื้อเย็น',
    consumed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    name: 'โยเกิร์ต รสธรรมชาติ 4 ถ้วย',
    category: 'dairy',
    compartment: 'fridge',
    quantity: 4,
    unit: 'ถ้วย',
    purchaseDate: addDaysToToday(-1),
    expirationDate: addDaysToToday(7), // 📅 เหลืออีก 7 วัน (ช่วงเตือน 7 วัน)
    notes: 'ซื้อจากโลตัส',
    consumed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-4',
    name: 'ผักสลัดไฮโดรโปนิกส์ กรีนโอ๊ค',
    category: 'produce',
    compartment: 'fridge',
    quantity: 1,
    unit: 'แพ็ค',
    purchaseDate: addDaysToToday(-4),
    expirationDate: addDaysToToday(-1), // 🔴 หมดอายุเมื่อวาน
    notes: 'เริ่มเหี่ยวแล้ว ตรวจสอบก่อนทาน',
    consumed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-5',
    name: 'แซลมอนนอร์เวย์ สเต๊กแช่แข็ง',
    category: 'seafood',
    compartment: 'freezer',
    quantity: 2,
    unit: 'ชิ้น',
    purchaseDate: addDaysToToday(-10),
    expirationDate: addDaysToToday(45), // 🟢 สดใหม่
    notes: 'แช่แข็งไว้อยู่ได้นาน',
    consumed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-6',
    name: 'แกงส้มชะอมกุ้ง (เหลือจากมื้อเย็น)',
    category: 'leftovers',
    compartment: 'fridge',
    quantity: 1,
    unit: 'กล่อง',
    purchaseDate: addDaysToToday(-1),
    expirationDate: addDaysToToday(1), // ⏳ เหลือ 1 วัน
    notes: 'ควรอุ่นทานให้หมดภายในพรุ่งนี้',
    consumed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
