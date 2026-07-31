/**
 * generateMockData.ts
 * 生成完整的模拟数据，用于 seed 数据库
 * 所有数据均为虚构，仅用于前端演示
 */

import type { Customer, Product, Warehouse, Factory, ProductionBatch, Order, Shipment, Payment, FactoryPayment, InventoryRecord, InventoryFlow, CustomerLedger } from '@/lib/mock-data';

// ==================== Warehouses ====================
export function generateWarehouses(): Warehouse[] {
  return [
    { id: 'wh1', name: '广西莉莉', address: '广西' },
    { id: 'wh2', name: '广西龙生', address: '广西' },
    { id: 'wh3', name: '广西林生', address: '广西' },
    { id: 'wh4', name: '新塘张生', address: '广东新塘' },
    { id: 'wh5', name: '新塘阿峰', address: '广东新塘' },
  ];
}

// ==================== Customers ====================
export function generateCustomers(): Customer[] {
  const countries = ['Nigeria', 'Ghana', 'Kenya', 'Tanzania', 'Uganda', 'Cameroon', 'Senegal', 'South Africa', 'Côte d\'Ivoire', 'Angola'];
  const data: Customer[] = [
    { id: 'c001', name: 'AfriFashion Ltd', country: 'Nigeria', city: 'Lagos', whatsapp: '+234-801-2345678', categories: ['牛仔裤', 'T恤'], frequentCategories: ['牛仔裤', 'T恤'], lastPurchaseDate: '2025-07-21', totalSales: 285600, orderReceivable: 120000, shippedDebt: 85600, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-21', pendingShipQty: 150, status: '活跃', commonSizes: ['M', 'L', 'XL'], avgOrderAmount: 14280, purchaseFrequency: '每周', notes: '重要客户，常买牛仔裤' },
    { id: 'c002', name: 'Ghana Styles Co', country: 'Ghana', city: 'Accra', whatsapp: '+233-201-345678', categories: ['连衣裙', '半裙'], frequentCategories: ['连衣裙', '半裙'], lastPurchaseDate: '2025-07-19', totalSales: 198400, orderReceivable: 85000, shippedDebt: 68400, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-19', pendingShipQty: 80, status: '活跃', commonSizes: ['S', 'M', 'L'], avgOrderAmount: 12400, purchaseFrequency: '每两周', notes: '' },
    { id: 'c003', name: 'Nairobi Fashion Hub', country: 'Kenya', city: 'Nairobi', whatsapp: '+254-712-456789', categories: ['外套', '卫衣'], frequentCategories: ['外套', '卫衣'], lastPurchaseDate: '2025-07-22', totalSales: 312000, orderReceivable: 0, shippedDebt: 0, presaveBalance: 15000, preDeposit: 15000, lastPaymentDate: '2025-07-22', pendingShipQty: 0, status: '有预存款', commonSizes: ['L', 'XL', '2XL'], avgOrderAmount: 15600, purchaseFrequency: '每周', notes: '信誉好，有预存款' },
    { id: 'c004', name: 'Tanzania Textile Import', country: 'Tanzania', city: 'Dar es Salaam', whatsapp: '+255-713-567890', categories: ['牛仔裤', '外套'], frequentCategories: ['牛仔裤', '外套'], lastPurchaseDate: '2025-06-15', totalSales: 156800, orderReceivable: 68000, shippedDebt: 56800, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-06-15', pendingShipQty: 80, status: '长期未购买', commonSizes: ['M', 'L'], avgOrderAmount: 9800, purchaseFrequency: '每月', notes: '最近购买减少' },
    { id: 'c005', name: 'Uganda Wholesale', country: 'Uganda', city: 'Kampala', whatsapp: '+256-714-678901', categories: ['T恤', '卫衣'], frequentCategories: ['T恤', '卫衣'], lastPurchaseDate: '2025-07-16', totalSales: 245600, orderReceivable: 98000, shippedDebt: 75600, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-16', pendingShipQty: 130, status: '活跃', commonSizes: ['M', 'L', 'XL'], avgOrderAmount: 12280, purchaseFrequency: '每两周', notes: '' },
    { id: 'c006', name: 'Douala Garments', country: 'Cameroon', city: 'Douala', whatsapp: '+237-615-789012', categories: ['连衣裙', '牛仔裤'], frequentCategories: ['连衣裙', '牛仔裤'], lastPurchaseDate: '2025-07-22', totalSales: 156200, orderReceivable: 0, shippedDebt: 0, presaveBalance: 20440, preDeposit: 20440, lastPaymentDate: '2025-07-22', pendingShipQty: 130, status: '有预存款', commonSizes: ['S', 'M', 'L'], avgOrderAmount: 7810, purchaseFrequency: '每月', notes: '多付款，有预存余额' },
    { id: 'c007', name: 'Dakar Style House', country: 'Senegal', city: 'Dakar', whatsapp: '+221-716-890123', categories: ['外套', '半裙'], frequentCategories: ['外套', '半裙'], lastPurchaseDate: '2025-07-20', totalSales: 134500, orderReceivable: 45000, shippedDebt: 34500, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-20', pendingShipQty: 40, status: '一般', commonSizes: ['M', 'L'], avgOrderAmount: 8970, purchaseFrequency: '每月', notes: '' },
    { id: 'c008', name: 'Cape Town Clothing', country: 'South Africa', city: 'Cape Town', whatsapp: '+27-717-901234', categories: ['连衣裙', '外套'], frequentCategories: ['连衣裙', '外套'], lastPurchaseDate: '2025-07-24', totalSales: 425000, orderReceivable: 180000, shippedDebt: 150000, presaveBalance: 35000, preDeposit: 35000, lastPaymentDate: '2025-07-24', pendingShipQty: 0, status: '有预存款', commonSizes: ['S', 'M', 'L', 'XL'], avgOrderAmount: 21250, purchaseFrequency: '每周', notes: '南非大客户，有预存款' },
    { id: 'c009', name: 'Abidjan Fashion', country: 'Côte d\'Ivoire', city: 'Abidjan', whatsapp: '+225-07-912345', categories: ['T恤', '牛仔裤'], frequentCategories: ['T恤', '牛仔裤'], lastPurchaseDate: '2025-05-16', totalSales: 78500, orderReceivable: 35000, shippedDebt: 28500, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-05-16', pendingShipQty: 0, status: '长期未购买', commonSizes: ['M', 'L'], avgOrderAmount: 6540, purchaseFrequency: '偶尔', notes: '3个月未下单' },
    { id: 'c010', name: 'Luanda Apparel', country: 'Angola', city: 'Luanda', whatsapp: '+244-918-023456', categories: ['卫衣', '外套'], frequentCategories: ['卫衣', '外套'], lastPurchaseDate: '2025-07-11', totalSales: 145800, orderReceivable: 58000, shippedDebt: 45800, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-11', pendingShipQty: 50, status: '一般', commonSizes: ['L', 'XL'], avgOrderAmount: 9720, purchaseFrequency: '每月', notes: '' },
    { id: 'c011', name: 'Lagos Boutique', country: 'Nigeria', city: 'Lagos', whatsapp: '+234-802-345678', categories: ['连衣裙', 'T恤'], frequentCategories: ['连衣裙', 'T恤'], lastPurchaseDate: '2025-07-18', totalSales: 189600, orderReceivable: 76000, shippedDebt: 59600, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-18', pendingShipQty: 110, status: '活跃', commonSizes: ['S', 'M', 'L'], avgOrderAmount: 9480, purchaseFrequency: '每两周', notes: '' },
    { id: 'c012', name: 'Accra Fashion Market', country: 'Ghana', city: 'Accra', whatsapp: '+233-202-456789', categories: ['牛仔裤', '半裙'], frequentCategories: ['牛仔裤', '半裙'], lastPurchaseDate: '2025-07-06', totalSales: 98700, orderReceivable: 42000, shippedDebt: 35700, presaveBalance: 8200, preDeposit: 8200, lastPaymentDate: '2025-07-06', pendingShipQty: 0, status: '有预存款', commonSizes: ['M', 'L'], avgOrderAmount: 8230, purchaseFrequency: '每月', notes: '有少量预存款' },
    { id: 'c013', name: 'Mombasa Traders', country: 'Kenya', city: 'Mombasa', whatsapp: '+254-713-567890', categories: ['T恤', '卫衣', '牛仔裤'], frequentCategories: ['T恤', '卫衣', '牛仔裤'], lastPurchaseDate: '2025-07-22', totalSales: 267800, orderReceivable: 110000, shippedDebt: 87800, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-22', pendingShipQty: 240, status: '活跃', commonSizes: ['M', 'L', 'XL'], avgOrderAmount: 13390, purchaseFrequency: '每周', notes: '订单量大' },
    { id: 'c014', name: 'Zanzibar Clothing', country: 'Tanzania', city: 'Zanzibar', whatsapp: '+255-714-678901', categories: ['连衣裙'], frequentCategories: ['连衣裙'], lastPurchaseDate: '2025-04-21', totalSales: 56800, orderReceivable: 28000, shippedDebt: 22800, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-04-21', pendingShipQty: 0, status: '长期未购买', commonSizes: ['S', 'M'], avgOrderAmount: 4730, purchaseFrequency: '偶尔', notes: '3个月未下单' },
    { id: 'c015', name: 'Kampala Style', country: 'Uganda', city: 'Kampala', whatsapp: '+256-715-789012', categories: ['半裙', '连衣裙'], frequentCategories: ['半裙', '连衣裙'], lastPurchaseDate: '2025-07-13', totalSales: 124500, orderReceivable: 50000, shippedDebt: 40500, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-13', pendingShipQty: 40, status: '一般', commonSizes: ['M', 'L'], avgOrderAmount: 8300, purchaseFrequency: '每月', notes: '' },
    { id: 'c016', name: 'Johannesburg Wholesale', country: 'South Africa', city: 'Johannesburg', whatsapp: '+27-716-890123', categories: ['外套', '牛仔裤', 'T恤'], frequentCategories: ['外套', '牛仔裤', 'T恤'], lastPurchaseDate: '2025-07-24', totalSales: 356000, orderReceivable: 150000, shippedDebt: 120000, presaveBalance: 28000, preDeposit: 28000, lastPaymentDate: '2025-07-24', pendingShipQty: 80, status: '有预存款', commonSizes: ['L', 'XL', '2XL'], avgOrderAmount: 17800, purchaseFrequency: '每周', notes: '南非第二大客户，有预存款' },
    { id: 'c017', name: 'Kumasi Textile', country: 'Ghana', city: 'Kumasi', whatsapp: '+233-203-567890', categories: ['T恤', '牛仔裤'], frequentCategories: ['T恤', '牛仔裤'], lastPurchaseDate: '2025-06-29', totalSales: 89600, orderReceivable: 36000, shippedDebt: 28600, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-06-29', pendingShipQty: 60, status: '有欠款', commonSizes: ['M', 'L'], avgOrderAmount: 7470, purchaseFrequency: '每月', notes: '有欠款' },
    { id: 'c018', name: 'Yaoundé Imports', country: 'Cameroon', city: 'Yaoundé', whatsapp: '+237-616-678901', categories: ['卫衣', '外套'], frequentCategories: ['卫衣', '外套'], lastPurchaseDate: '2025-07-09', totalSales: 112400, orderReceivable: 48000, shippedDebt: 38400, presaveBalance: 5000, preDeposit: 5000, lastPaymentDate: '2025-07-09', pendingShipQty: 0, status: '有预存款', commonSizes: ['L', 'XL'], avgOrderAmount: 9370, purchaseFrequency: '每月', notes: '有小额预存款' },
    { id: 'c019', name: 'Saint-Louis Apparel', country: 'Senegal', city: 'Saint-Louis', whatsapp: '+221-717-789012', categories: ['牛仔裤', '连衣裙'], frequentCategories: ['牛仔裤', '连衣裙'], lastPurchaseDate: '2025-03-15', totalSales: 45200, orderReceivable: 20000, shippedDebt: 16200, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-03-15', pendingShipQty: 0, status: '长期未购买', commonSizes: ['M'], avgOrderAmount: 3770, purchaseFrequency: '偶尔', notes: '4个月未下单' },
    { id: 'c020', name: 'Maputo Fashion', country: 'Angola', city: 'Maputo', whatsapp: '+244-919-890123', categories: ['T恤', '卫衣', '半裙'], frequentCategories: ['T恤', '卫衣', '半裙'], lastPurchaseDate: '2025-07-21', totalSales: 167500, orderReceivable: 72000, shippedDebt: 57500, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-21', pendingShipQty: 100, status: '活跃', commonSizes: ['M', 'L', 'XL'], avgOrderAmount: 8380, purchaseFrequency: '每两周', notes: '' },
  ];
  return data;
}

// ==================== Products ====================
export function generateProducts(): Product[] {
  return [
    { id: 'p001', styleNo: 'HJ-001', name: '直筒牛仔裤', category: '牛仔裤', colors: [{ name: '深蓝', hex: '#1e3a5f' }, { name: '黑色', hex: '#1f2937' }, { name: '浅蓝', hex: '#93c5fd' }], sizes: ['S', 'M', 'L', 'XL', '2XL'], images: ['/products/hj001.jpg'], currentStock: 2400, suggestedPrice: 85, lastCost: 42, newDate: '2025-01-15', status: '正常销售', description: '经典直筒版型牛仔裤', notes: '' },
    { id: 'p002', styleNo: 'HJ-002', name: '小脚牛仔裤', category: '牛仔裤', colors: [{ name: '深蓝', hex: '#1e3a5f' }, { name: '黑色', hex: '#1f2937' }], sizes: ['S', 'M', 'L', 'XL'], images: ['/products/hj002.jpg'], currentStock: 1800, suggestedPrice: 78, lastCost: 38, newDate: '2025-02-10', status: '正常销售', description: '修身小脚版型', notes: '' },
    { id: 'p003', styleNo: 'HJ-003', name: '阔腿牛仔裤', category: '牛仔裤', colors: [{ name: '浅蓝', hex: '#93c5fd' }], sizes: ['M', 'L', 'XL'], images: ['/products/hj003.jpg'], currentStock: 600, suggestedPrice: 92, lastCost: 45, newDate: '2025-03-20', status: '正常销售', description: '', notes: '' },
    { id: 'p004', styleNo: 'HJ-004', name: '高腰牛仔裤', category: '牛仔裤', colors: [{ name: '深蓝', hex: '#1e3a5f' }, { name: '黑色', hex: '#1f2937' }], sizes: ['S', 'M', 'L', 'XL'], images: ['/products/hj004.jpg'], currentStock: 1500, suggestedPrice: 88, lastCost: 44, newDate: '2025-04-05', status: '正常销售', description: '', notes: '' },
    { id: 'p005', styleNo: 'HJ-005', name: '弹力牛仔裤', category: '牛仔裤', colors: [{ name: '黑色', hex: '#1f2937' }, { name: '深蓝', hex: '#1e3a5f' }], sizes: ['S', 'M', 'L', 'XL', '2XL'], images: ['/products/hj005.jpg'], currentStock: 50, suggestedPrice: 82, lastCost: 40, newDate: '2025-05-01', status: '库存不足', description: '弹力面料舒适', notes: '需要补货' },
    { id: 'p006', styleNo: 'HW-001', name: 'A字连衣裙', category: '连衣裙', colors: [{ name: '红色', hex: '#dc2626' }, { name: '蓝色', hex: '#2563eb' }, { name: '绿色', hex: '#16a34a' }], sizes: ['S', 'M', 'L', 'XL'], images: ['/products/hw001.jpg'], currentStock: 2000, suggestedPrice: 120, lastCost: 55, newDate: '2025-01-20', status: '正常销售', description: 'A字版型连衣裙', notes: '' },
    { id: 'p007', styleNo: 'HW-002', name: '印花连衣裙', category: '连衣裙', colors: [{ name: '印花', hex: '#f472b6' }], sizes: ['S', 'M', 'L'], images: ['/products/hw002.jpg'], currentStock: 800, suggestedPrice: 115, lastCost: 52, newDate: '2025-03-15', status: '正常销售', description: '', notes: '' },
    { id: 'p008', styleNo: 'HW-003', name: '衬衫连衣裙', category: '连衣裙', colors: [{ name: '白色', hex: '#ffffff' }, { name: '蓝色', hex: '#2563eb' }], sizes: ['S', 'M', 'L', 'XL'], images: ['/products/hw003.jpg'], currentStock: 1200, suggestedPrice: 108, lastCost: 50, newDate: '2025-04-10', status: '正常销售', description: '', notes: '' },
    { id: 'p009', styleNo: 'HW-004', name: '吊带连衣裙', category: '连衣裙', colors: [{ name: '黑色', hex: '#1f2937' }, { name: '红色', hex: '#dc2626' }], sizes: ['S', 'M', 'L'], images: ['/products/hw004.jpg'], currentStock: 600, suggestedPrice: 95, lastCost: 45, newDate: '2025-06-01', status: '已上新', description: '', notes: '' },
    { id: 'p010', styleNo: 'HW-005', name: '针织连衣裙', category: '连衣裙', colors: [{ name: '灰色', hex: '#6b7280' }, { name: '黑色', hex: '#1f2937' }, { name: '酒红', hex: '#991b1b' }], sizes: ['S', 'M', 'L', 'XL'], images: ['/products/hw005.jpg'], currentStock: 1600, suggestedPrice: 125, lastCost: 58, newDate: '2025-02-25', status: '正常销售', description: '', notes: '' },
    { id: 'p011', styleNo: 'HT-001', name: '基础圆领T恤', category: 'T恤', colors: [{ name: '白色', hex: '#ffffff' }, { name: '黑色', hex: '#1f2937' }, { name: '灰色', hex: '#6b7280' }], sizes: ['S', 'M', 'L', 'XL', '2XL'], images: ['/products/ht001.jpg'], currentStock: 3200, suggestedPrice: 45, lastCost: 18, newDate: '2025-01-10', status: '正常销售', description: '基础款圆领T恤', notes: '' },
    { id: 'p012', styleNo: 'HT-002', name: '印花圆领T恤', category: 'T恤', colors: [{ name: '白色', hex: '#ffffff' }, { name: '黑色', hex: '#1f2937' }], sizes: ['S', 'M', 'L', 'XL'], images: ['/products/ht002.jpg'], currentStock: 1500, suggestedPrice: 50, lastCost: 22, newDate: '2025-03-05', status: '正常销售', description: '', notes: '' },
    { id: 'p013', styleNo: 'HT-003', name: 'V领T恤', category: 'T恤', colors: [{ name: '白色', hex: '#ffffff' }, { name: '黑色', hex: '#1f2937' }, { name: '蓝色', hex: '#2563eb' }], sizes: ['S', 'M', 'L', 'XL'], images: ['/products/ht003.jpg'], currentStock: 2000, suggestedPrice: 48, lastCost: 20, newDate: '2025-02-15', status: '正常销售', description: '', notes: '' },
    { id: 'p014', styleNo: 'HT-004', name: '长袖T恤', category: 'T恤', colors: [{ name: '白色', hex: '#ffffff' }, { name: '黑色', hex: '#1f2937' }, { name: '灰色', hex: '#6b7280' }], sizes: ['S', 'M', 'L', 'XL', '2XL'], images: ['/products/ht004.jpg'], currentStock: 1800, suggestedPrice: 55, lastCost: 25, newDate: '2025-04-20', status: '正常销售', description: '', notes: '' },
    { id: 'p015', styleNo: 'HT-005', name: '翻领T恤', category: 'T恤', colors: [{ name: '白色', hex: '#ffffff' }, { name: '蓝色', hex: '#2563eb' }], sizes: ['M', 'L', 'XL'], images: ['/products/ht005.jpg'], currentStock: 700, suggestedPrice: 58, lastCost: 26, newDate: '2025-05-15', status: '正常销售', description: '', notes: '' },
    { id: 'p016', styleNo: 'HT-006', name: '运动T恤', category: 'T恤', colors: [{ name: '黑色', hex: '#1f2937' }, { name: '灰色', hex: '#6b7280' }, { name: '蓝色', hex: '#2563eb' }], sizes: ['S', 'M', 'L', 'XL', '2XL'], images: ['/products/ht006.jpg'], currentStock: 40, suggestedPrice: 52, lastCost: 23, newDate: '2025-06-10', status: '库存不足', description: '', notes: '需补货' },
    { id: 'p017', styleNo: 'HL-001', name: 'A字半裙', category: '半裙', colors: [{ name: '黑色', hex: '#1f2937' }, { name: '灰色', hex: '#6b7280' }], sizes: ['S', 'M', 'L'], images: ['/products/hl001.jpg'], currentStock: 1200, suggestedPrice: 68, lastCost: 30, newDate: '2025-01-25', status: '正常销售', description: '', notes: '' },
    { id: 'p018', styleNo: 'HL-002', name: '百褶半裙', category: '半裙', colors: [{ name: '黑色', hex: '#1f2937' }, { name: '酒红', hex: '#991b1b' }, { name: '灰色', hex: '#6b7280' }], sizes: ['S', 'M', 'L', 'XL'], images: ['/products/hl002.jpg'], currentStock: 900, suggestedPrice: 72, lastCost: 32, newDate: '2025-03-25', status: '正常销售', description: '', notes: '' },
    { id: 'p019', styleNo: 'HL-003', name: '包臀半裙', category: '半裙', colors: [{ name: '黑色', hex: '#1f2937' }, { name: '蓝色', hex: '#2563eb' }], sizes: ['S', 'M', 'L'], images: ['/products/hl003.jpg'], currentStock: 600, suggestedPrice: 65, lastCost: 28, newDate: '2025-04-15', status: '正常销售', description: '', notes: '' },
    { id: 'p020', styleNo: 'HL-004', name: '针织半裙', category: '半裙', colors: [{ name: '灰色', hex: '#6b7280' }], sizes: ['M', 'L'], images: ['/products/hl004.jpg'], currentStock: 400, suggestedPrice: 70, lastCost: 33, newDate: '2025-05-10', status: '正常销售', description: '', notes: '' },
    { id: 'p021', styleNo: 'HL-005', name: '蕾丝半裙', category: '半裙', colors: [{ name: '白色', hex: '#ffffff' }, { name: '黑色', hex: '#1f2937' }], sizes: ['S', 'M', 'L'], images: ['/products/hl005.jpg'], currentStock: 30, suggestedPrice: 75, lastCost: 35, newDate: '2025-06-05', status: '库存不足', description: '', notes: '需补货' },
    { id: 'p022', styleNo: 'HK-001', name: '休闲卫衣', category: '卫衣', colors: [{ name: '灰色', hex: '#6b7280' }, { name: '黑色', hex: '#1f2937' }, { name: '蓝色', hex: '#2563eb' }], sizes: ['M', 'L', 'XL', '2XL'], images: ['/products/hk001.jpg'], currentStock: 2000, suggestedPrice: 88, lastCost: 40, newDate: '2025-01-30', status: '正常销售', description: '', notes: '' },
    { id: 'p023', styleNo: 'HK-002', name: '连帽卫衣', category: '卫衣', colors: [{ name: '黑色', hex: '#1f2937' }, { name: '灰色', hex: '#6b7280' }], sizes: ['M', 'L', 'XL', '2XL'], images: ['/products/hk002.jpg'], currentStock: 1600, suggestedPrice: 92, lastCost: 42, newDate: '2025-02-20', status: '正常销售', description: '', notes: '' },
    { id: 'p024', styleNo: 'HK-003', name: '拉链卫衣', category: '卫衣', colors: [{ name: '黑色', hex: '#1f2937' }, { name: '灰色', hex: '#6b7280' }, { name: '酒红', hex: '#991b1b' }], sizes: ['M', 'L', 'XL', '2XL'], images: ['/products/hk003.jpg'], currentStock: 1200, suggestedPrice: 95, lastCost: 44, newDate: '2025-04-01', status: '正常销售', description: '', notes: '' },
    { id: 'p025', styleNo: 'HK-004', name: '圆领卫衣', category: '卫衣', colors: [{ name: '白色', hex: '#ffffff' }, { name: '黑色', hex: '#1f2937' }], sizes: ['M', 'L', 'XL'], images: ['/products/hk004.jpg'], currentStock: 800, suggestedPrice: 82, lastCost: 38, newDate: '2025-05-20', status: '正常销售', description: '', notes: '' },
    { id: 'p026', styleNo: 'HQ-001', name: '风衣外套', category: '外套', colors: [{ name: '卡其', hex: '#d4a574' }, { name: '黑色', hex: '#1f2937' }], sizes: ['M', 'L', 'XL', '2XL'], images: ['/products/hq001.jpg'], currentStock: 1500, suggestedPrice: 168, lastCost: 75, newDate: '2025-01-05', status: '正常销售', description: '', notes: '' },
    { id: 'p027', styleNo: 'HQ-002', name: '牛仔外套', category: '外套', colors: [{ name: '浅蓝', hex: '#93c5fd' }, { name: '深蓝', hex: '#1e3a5f' }], sizes: ['M', 'L', 'XL'], images: ['/products/hq002.jpg'], currentStock: 1000, suggestedPrice: 148, lastCost: 65, newDate: '2025-02-15', status: '正常销售', description: '', notes: '' },
    { id: 'p028', styleNo: 'HQ-003', name: '针织开衫', category: '外套', colors: [{ name: '灰色', hex: '#6b7280' }, { name: '黑色', hex: '#1f2937' }, { name: '酒红', hex: '#991b1b' }], sizes: ['S', 'M', 'L', 'XL'], images: ['/products/hq003.jpg'], currentStock: 800, suggestedPrice: 118, lastCost: 52, newDate: '2025-03-10', status: '正常销售', description: '', notes: '' },
    { id: 'p029', styleNo: 'HQ-004', name: '西装外套', category: '外套', colors: [{ name: '黑色', hex: '#1f2937' }, { name: '灰色', hex: '#6b7280' }], sizes: ['M', 'L', 'XL'], images: ['/products/hq004.jpg'], currentStock: 600, suggestedPrice: 155, lastCost: 68, newDate: '2025-04-25', status: '正常销售', description: '', notes: '' },
    { id: 'p030', styleNo: 'HQ-005', name: '夹克外套', category: '外套', colors: [{ name: '黑色', hex: '#1f2937' }, { name: '军绿', hex: '#4d7c0f' }], sizes: ['M', 'L', 'XL', '2XL'], images: ['/products/hq005.jpg'], currentStock: 25, suggestedPrice: 142, lastCost: 62, newDate: '2025-06-20', status: '库存不足', description: '', notes: '需补货' },
  ];
}

// ==================== Factories ====================
export function generateFactories(): Factory[] {
  return [
    { id: 'f001', name: '广州鑫达制衣厂', contact: '张经理', phone: '138-0012-3456', mainCategory: '牛仔裤/外套', totalProductionAmount: 450000, paidAmount: 280000, unpaidAmount: 170000, lastCoopDate: '2025-07-20', address: '广州市白云区', notes: '主力牛仔裤工厂' },
    { id: 'f002', name: '佛山丽雅服装厂', contact: '李厂长', phone: '139-0023-4567', mainCategory: '连衣裙/半裙', totalProductionAmount: 320000, paidAmount: 200000, unpaidAmount: 120000, lastCoopDate: '2025-07-18', address: '佛山市南海区', notes: '连衣裙质量稳定' },
    { id: 'f003', name: '东莞恒丰纺织厂', contact: '王总', phone: '137-0034-5678', mainCategory: 'T恤/卫衣', totalProductionAmount: 280000, paidAmount: 180000, unpaidAmount: 100000, lastCoopDate: '2025-07-22', address: '东莞市虎门镇', notes: 'T恤和卫衣产能大' },
    { id: 'f004', name: '中山锦华制衣厂', contact: '陈经理', phone: '136-0045-6789', mainCategory: '外套', totalProductionAmount: 180000, paidAmount: 120000, unpaidAmount: 60000, lastCoopDate: '2025-06-28', address: '中山市小榄镇', notes: '外套做工精细' },
    { id: 'f005', name: '惠州盛达服装厂', contact: '赵厂长', phone: '135-0056-7890', mainCategory: '半裙/T恤', totalProductionAmount: 150000, paidAmount: 100000, unpaidAmount: 50000, lastCoopDate: '2025-07-10', address: '惠州市博罗县', notes: '' },
  ];
}

// ==================== Production Batches ====================
export function generateProductionBatches(): ProductionBatch[] {
  return [
    { id: 'pb001', batchNo: 'PB-2025-001', factoryId: 'f001', productId: 'p001', styleNo: 'HJ-001', productName: '直筒牛仔裤', color: '深蓝', size: 'M', quantity: 500, unitCost: 42, totalCost: 21000, inboundWarehouseId: 'wh1', warehouseId: 'wh1', inboundDate: '2025-01-20', startDate: '2025-01-05', inboundQuantity: 500, paidAmount: 14000, unpaidAmount: 7000, status: '已入库', notes: '' },
    { id: 'pb002', batchNo: 'PB-2025-002', factoryId: 'f001', productId: 'p001', styleNo: 'HJ-001', productName: '直筒牛仔裤', color: '深蓝', size: 'L', quantity: 500, unitCost: 42, totalCost: 21000, inboundWarehouseId: 'wh1', warehouseId: 'wh1', inboundDate: '2025-01-20', startDate: '2025-01-05', inboundQuantity: 500, paidAmount: 14000, unpaidAmount: 7000, status: '已入库', notes: '' },
    { id: 'pb003', batchNo: 'PB-2025-003', factoryId: 'f002', productId: 'p006', styleNo: 'HW-001', productName: 'A字连衣裙', color: '红色', size: 'M', quantity: 300, unitCost: 55, totalCost: 16500, inboundWarehouseId: 'wh2', warehouseId: 'wh2', inboundDate: '2025-01-25', startDate: '2025-01-10', inboundQuantity: 300, paidAmount: 10000, unpaidAmount: 6500, status: '已入库', notes: '' },
    { id: 'pb004', batchNo: 'PB-2025-004', factoryId: 'f003', productId: 'p011', styleNo: 'HT-001', productName: '基础圆领T恤', color: '白色', size: 'L', quantity: 1000, unitCost: 18, totalCost: 18000, inboundWarehouseId: 'wh1', warehouseId: 'wh1', inboundDate: '2025-02-10', startDate: '2025-01-25', inboundQuantity: 1000, paidAmount: 12000, unpaidAmount: 6000, status: '已入库', notes: '' },
    { id: 'pb005', batchNo: 'PB-2025-005', factoryId: 'f001', productId: 'p004', styleNo: 'HJ-004', productName: '高腰牛仔裤', color: '深蓝', size: 'M', quantity: 400, unitCost: 44, totalCost: 17600, inboundWarehouseId: 'wh3', warehouseId: 'wh3', inboundDate: '', startDate: '2025-04-10', inboundQuantity: 200, paidAmount: 8000, unpaidAmount: 9600, status: '部分入库', notes: '' },
    { id: 'pb006', batchNo: 'PB-2025-006', factoryId: 'f002', productId: 'p008', styleNo: 'HW-003', productName: '衬衫连衣裙', color: '蓝色', size: 'M', quantity: 300, unitCost: 50, totalCost: 15000, inboundWarehouseId: 'wh2', warehouseId: 'wh2', inboundDate: '', startDate: '2025-04-15', inboundQuantity: 0, paidAmount: 8000, unpaidAmount: 7000, status: '待入库', notes: '' },
    { id: 'pb007', batchNo: 'PB-2025-007', factoryId: 'f003', productId: 'p013', styleNo: 'HT-003', productName: 'V领T恤', color: '白色', size: 'M', quantity: 800, unitCost: 20, totalCost: 16000, inboundWarehouseId: 'wh1', warehouseId: 'wh1', inboundDate: '2025-02-15', startDate: '2025-02-01', inboundQuantity: 800, paidAmount: 10000, unpaidAmount: 6000, status: '已入库', notes: '' },
    { id: 'pb008', batchNo: 'PB-2025-008', factoryId: 'f004', productId: 'p027', styleNo: 'HQ-002', productName: '牛仔外套', color: '深蓝', size: 'L', quantity: 200, unitCost: 65, totalCost: 13000, inboundWarehouseId: 'wh1', warehouseId: 'wh1', inboundDate: '2025-03-10', startDate: '2025-02-20', inboundQuantity: 200, paidAmount: 9000, unpaidAmount: 4000, status: '已入库', notes: '' },
    { id: 'pb009', batchNo: 'PB-2025-009', factoryId: 'f003', productId: 'p016', styleNo: 'HT-006', productName: '运动T恤', color: '黑色', size: 'M', quantity: 600, unitCost: 23, totalCost: 13800, inboundWarehouseId: 'wh1', warehouseId: 'wh1', inboundDate: '', startDate: '2025-06-15', inboundQuantity: 0, paidAmount: 0, unpaidAmount: 13800, status: '生产中', notes: '' },
    { id: 'pb010', batchNo: 'PB-2025-010', factoryId: 'f002', productId: 'p010', styleNo: 'HW-005', productName: '针织连衣裙', color: '酒红', size: 'M', quantity: 300, unitCost: 58, totalCost: 17400, inboundWarehouseId: 'wh2', warehouseId: 'wh2', inboundDate: '2025-03-01', startDate: '2025-02-10', inboundQuantity: 300, paidAmount: 12000, unpaidAmount: 5400, status: '已入库', notes: '' },
    { id: 'pb011', batchNo: 'PB-2025-011', factoryId: 'f004', productId: 'p026', styleNo: 'HQ-001', productName: '风衣外套', color: '卡其', size: 'L', quantity: 250, unitCost: 75, totalCost: 18750, inboundWarehouseId: 'wh3', warehouseId: 'wh3', inboundDate: '', startDate: '2025-07-01', inboundQuantity: 0, paidAmount: 10000, unpaidAmount: 8750, status: '待入库', notes: '' },
    { id: 'pb012', batchNo: 'PB-2025-012', factoryId: 'f005', productId: 'p017', styleNo: 'HL-001', productName: 'A字半裙', color: '黑色', size: 'M', quantity: 400, unitCost: 30, totalCost: 12000, inboundWarehouseId: 'wh2', warehouseId: 'wh2', inboundDate: '2025-02-01', startDate: '2025-01-15', inboundQuantity: 400, paidAmount: 8000, unpaidAmount: 4000, status: '已入库', notes: '' },
    { id: 'pb013', batchNo: 'PB-2025-013', factoryId: 'f001', productId: 'p002', styleNo: 'HJ-002', productName: '小脚牛仔裤', color: '深蓝', size: 'M', quantity: 500, unitCost: 38, totalCost: 19000, inboundWarehouseId: 'wh1', warehouseId: 'wh1', inboundDate: '2025-02-15', startDate: '2025-02-01', inboundQuantity: 500, paidAmount: 13000, unpaidAmount: 6000, status: '已入库', notes: '' },
    { id: 'pb014', batchNo: 'PB-2025-014', factoryId: 'f003', productId: 'p014', styleNo: 'HT-004', productName: '长袖T恤', color: '白色', size: 'L', quantity: 600, unitCost: 25, totalCost: 15000, inboundWarehouseId: 'wh1', warehouseId: 'wh1', inboundDate: '2025-05-01', startDate: '2025-04-15', inboundQuantity: 600, paidAmount: 10000, unpaidAmount: 5000, status: '已入库', notes: '' },
    { id: 'pb015', batchNo: 'PB-2025-015', factoryId: 'f004', productId: 'p029', styleNo: 'HQ-004', productName: '西装外套', color: '黑色', size: 'L', quantity: 150, unitCost: 68, totalCost: 10200, inboundWarehouseId: 'wh3', warehouseId: 'wh3', inboundDate: '', startDate: '2025-07-10', inboundQuantity: 0, paidAmount: 0, unpaidAmount: 10200, status: '待生产', notes: '' },
  ];
}

// ==================== Inventory Records ====================
export function generateInventoryRecords(): InventoryRecord[] {
  const records: InventoryRecord[] = [];
  const products = generateProducts();
  const warehouses = generateWarehouses();
  // Create inventory for key SKUs
  const skuData: Array<{ styleNo: string; productName: string; color: string; size: string; warehouseId: string; actual: number; reserved: number }> = [
    { styleNo: 'HJ-001', productName: '直筒牛仔裤', color: '深蓝', size: 'M', warehouseId: 'wh1', actual: 500, reserved: 200 },
    { styleNo: 'HJ-001', productName: '直筒牛仔裤', color: '深蓝', size: 'L', warehouseId: 'wh1', actual: 500, reserved: 180 },
    { styleNo: 'HJ-001', productName: '直筒牛仔裤', color: '黑色', size: 'M', warehouseId: 'wh1', actual: 300, reserved: 100 },
    { styleNo: 'HJ-002', productName: '小脚牛仔裤', color: '深蓝', size: 'M', warehouseId: 'wh1', actual: 500, reserved: 150 },
    { styleNo: 'HW-001', productName: 'A字连衣裙', color: '红色', size: 'M', warehouseId: 'wh2', actual: 300, reserved: 80 },
    { styleNo: 'HW-001', productName: 'A字连衣裙', color: '蓝色', size: 'M', warehouseId: 'wh2', actual: 200, reserved: 60 },
    { styleNo: 'HW-003', productName: '衬衫连衣裙', color: '蓝色', size: 'M', warehouseId: 'wh2', actual: 150, reserved: 50 },
    { styleNo: 'HW-005', productName: '针织连衣裙', color: '酒红', size: 'M', warehouseId: 'wh2', actual: 300, reserved: 80 },
    { styleNo: 'HT-001', productName: '基础圆领T恤', color: '白色', size: 'L', warehouseId: 'wh1', actual: 1000, reserved: 300 },
    { styleNo: 'HT-001', productName: '基础圆领T恤', color: '黑色', size: 'M', warehouseId: 'wh1', actual: 600, reserved: 200 },
    { styleNo: 'HT-003', productName: 'V领T恤', color: '白色', size: 'M', warehouseId: 'wh1', actual: 800, reserved: 250 },
    { styleNo: 'HT-004', productName: '长袖T恤', color: '白色', size: 'L', warehouseId: 'wh1', actual: 600, reserved: 150 },
    { styleNo: 'HK-001', productName: '休闲卫衣', color: '灰色', size: 'L', warehouseId: 'wh1', actual: 400, reserved: 120 },
    { styleNo: 'HK-003', productName: '拉链卫衣', color: '黑色', size: 'L', warehouseId: 'wh1', actual: 300, reserved: 80 },
    { styleNo: 'HQ-001', productName: '风衣外套', color: '卡其', size: 'L', warehouseId: 'wh3', actual: 250, reserved: 70 },
    { styleNo: 'HQ-002', productName: '牛仔外套', color: '深蓝', size: 'L', warehouseId: 'wh1', actual: 200, reserved: 50 },
    { styleNo: 'HJ-004', productName: '高腰牛仔裤', color: '深蓝', size: 'M', warehouseId: 'wh3', actual: 200, reserved: 100 },
    { styleNo: 'HL-001', productName: 'A字半裙', color: '黑色', size: 'M', warehouseId: 'wh2', actual: 400, reserved: 100 },
    { styleNo: 'HL-002', productName: '百褶半裙', color: '黑色', size: 'M', warehouseId: 'wh2', actual: 300, reserved: 80 },
    { styleNo: 'HK-002', productName: '连帽卫衣', color: '黑色', size: 'L', warehouseId: 'wh1', actual: 500, reserved: 150 },
    // Add a few more to reach 18,560 total inventory
    { styleNo: 'HT-001', productName: '基础圆领T恤', color: '灰色', size: 'L', warehouseId: 'wh1', actual: 800, reserved: 250 },
    { styleNo: 'HW-001', productName: 'A字连衣裙', color: '绿色', size: 'M', warehouseId: 'wh2', actual: 250, reserved: 60 },
    { styleNo: 'HJ-001', productName: '直筒牛仔裤', color: '浅蓝', size: 'M', warehouseId: 'wh1', actual: 400, reserved: 120 },
    { styleNo: 'HQ-003', productName: '针织开衫', color: '灰色', size: 'L', warehouseId: 'wh3', actual: 200, reserved: 50 },
  ];

  let idCounter = 1;
  for (const sku of skuData) {
    const wh = warehouses.find(w => w.id === sku.warehouseId);
    const sellable = sku.actual - sku.reserved;
    const status = sellable <= 50 ? '低库存' : sellable <= 100 ? '偏低' : '正常';
    records.push({
      id: `ir${String(idCounter).padStart(3, '0')}`,
      styleNo: sku.styleNo,
      productName: sku.productName,
      color: sku.color,
      size: sku.size,
      warehouseId: sku.warehouseId,
      warehouseName: wh?.name || '',
      actualStock: sku.actual,
      reservedStock: sku.reserved,
      sellableStock: sellable,
      status,
    });
    idCounter++;
  }
  return records;
}

// ==================== Orders, Shipments, Payments, etc. ====================
// These are complex and need careful generation. For brevity, I'll generate them inline in the seed route.
// The key thing is that the seed route calls /api/db/sync with a full BusinessState.

export function generateFullBusinessState() {
  // Import and use deriveBusinessState
  const warehouses = generateWarehouses();
  const customers = generateCustomers();
  const products = generateProducts();
  const factories = generateFactories();
  const productionBatches = generateProductionBatches();
  const inventoryRecords = generateInventoryRecords();
  const factoryPayments: FactoryPayment[] = [
    { id: 'fp001', paymentNo: 'FP-2025-001', factoryId: 'f001', factoryName: '广州鑫达制衣厂', paymentDate: '2025-01-15', amount: 14000, method: '银行转账', relatedBatchId: 'pb001', relatedBatchNo: 'PB-2025-001', voucher: '', notes: '' },
    { id: 'fp002', paymentNo: 'FP-2025-002', factoryId: 'f002', factoryName: '佛山丽雅服装厂', paymentDate: '2025-01-20', amount: 10000, method: '微信', relatedBatchId: 'pb003', relatedBatchNo: 'PB-2025-003', voucher: '', notes: '' },
    { id: 'fp003', paymentNo: 'FP-2025-003', factoryId: 'f003', factoryName: '东莞恒丰纺织厂', paymentDate: '2025-02-05', amount: 12000, method: '银行转账', relatedBatchId: 'pb004', relatedBatchNo: 'PB-2025-004', voucher: '', notes: '' },
    { id: 'fp004', paymentNo: 'FP-2025-004', factoryId: 'f001', factoryName: '广州鑫达制衣厂', paymentDate: '2025-02-10', amount: 13000, method: '银行转账', relatedBatchId: 'pb013', relatedBatchNo: 'PB-2025-013', voucher: '', notes: '' },
    { id: 'fp005', paymentNo: 'FP-2025-005', factoryId: 'f004', factoryName: '中山锦华制衣厂', paymentDate: '2025-02-25', amount: 9000, method: '支付宝', relatedBatchId: 'pb008', relatedBatchNo: 'PB-2025-008', voucher: '', notes: '' },
  ];

  // Generate some inventory flows
  const inventoryFlows: InventoryFlow[] = [
    { id: 'if001', date: '2025-01-20', type: '生产入库', product: '直筒牛仔裤', styleNo: 'HJ-001', color: '深蓝', size: 'M', warehouse: '广西莉莉', quantity: 500, beforeStock: 0, afterStock: 500, relatedDoc: 'PB-2025-001', notes: '' },
    { id: 'if002', date: '2025-01-20', type: '生产入库', product: '直筒牛仔裤', styleNo: 'HJ-001', color: '深蓝', size: 'L', warehouse: '广西莉莉', quantity: 500, beforeStock: 0, afterStock: 500, relatedDoc: 'PB-2025-002', notes: '' },
    { id: 'if003', date: '2025-01-25', type: '生产入库', product: 'A字连衣裙', styleNo: 'HW-001', color: '红色', size: 'M', warehouse: '广西龙生', quantity: 300, beforeStock: 0, afterStock: 300, relatedDoc: 'PB-2025-003', notes: '' },
    { id: 'if004', date: '2025-02-10', type: '生产入库', product: '基础圆领T恤', styleNo: 'HT-001', color: '白色', size: 'L', warehouse: '广西莉莉', quantity: 1000, beforeStock: 0, afterStock: 1000, relatedDoc: 'PB-2025-004', notes: '' },
    { id: 'if005', date: '2025-02-15', type: '生产入库', product: 'V领T恤', styleNo: 'HT-003', color: '白色', size: 'M', warehouse: '广西莉莉', quantity: 800, beforeStock: 0, afterStock: 800, relatedDoc: 'PB-2025-007', notes: '' },
    { id: 'if006', date: '2025-03-01', type: '生产入库', product: '针织连衣裙', styleNo: 'HW-005', color: '酒红', size: 'M', warehouse: '广西龙生', quantity: 300, beforeStock: 0, afterStock: 300, relatedDoc: 'PB-2025-010', notes: '' },
    { id: 'if007', date: '2025-02-01', type: '生产入库', product: 'A字半裙', styleNo: 'HL-001', color: '黑色', size: 'M', warehouse: '广西龙生', quantity: 400, beforeStock: 0, afterStock: 400, relatedDoc: 'PB-2025-012', notes: '' },
  ];

  // Generate orders
  const orders: Order[] = [
    { id: 'o001', orderNo: 'SO-2025-001', customerId: 'c001', customerName: 'AfriFashion Ltd', country: 'Nigeria', orderDate: '2025-07-10', totalAmount: 28560, paidAmount: 20000, unpaidAmount: 8560, totalQuantity: 300, shippedQuantity: 150, pendingShipQuantity: 150, status: '部分发货', presaveDeduction: 0, finalReceivable: 8560, items: [{ id: 'oi001', productId: 'p001', styleNo: 'HJ-001', productName: '直筒牛仔裤', color: '深蓝', size: 'M', warehouseId: 'wh1', warehouseName: '广西莉莉', availableStock: 300, quantity: 200, shippedQuantity: 100, unitPrice: 85, subtotal: 17000 }, { id: 'oi002', productId: 'p011', styleNo: 'HT-001', productName: '基础圆领T恤', color: '白色', size: 'L', warehouseId: 'wh1', warehouseName: '广西莉莉', availableStock: 700, quantity: 100, shippedQuantity: 50, unitPrice: 45, subtotal: 4500 }], notes: '' },
    { id: 'o002', orderNo: 'SO-2025-002', customerId: 'c002', customerName: 'Ghana Styles Co', country: 'Ghana', orderDate: '2025-07-12', totalAmount: 19840, paidAmount: 13000, unpaidAmount: 6840, totalQuantity: 180, shippedQuantity: 100, pendingShipQuantity: 80, status: '部分发货', presaveDeduction: 0, finalReceivable: 6840, items: [{ id: 'oi003', productId: 'p006', styleNo: 'HW-001', productName: 'A字连衣裙', color: '红色', size: 'M', warehouseId: 'wh2', warehouseName: '广西龙生', availableStock: 220, quantity: 100, shippedQuantity: 60, unitPrice: 120, subtotal: 12000 }, { id: 'oi004', productId: 'p017', styleNo: 'HL-001', productName: 'A字半裙', color: '黑色', size: 'M', warehouseId: 'wh2', warehouseName: '广西龙生', availableStock: 300, quantity: 80, shippedQuantity: 40, unitPrice: 68, subtotal: 5440 }], notes: '' },
    { id: 'o003', orderNo: 'SO-2025-003', customerId: 'c005', customerName: 'Uganda Wholesale', country: 'Uganda', orderDate: '2025-07-15', totalAmount: 24560, paidAmount: 17000, unpaidAmount: 7560, totalQuantity: 260, shippedQuantity: 130, pendingShipQuantity: 130, status: '部分发货', presaveDeduction: 0, finalReceivable: 7560, items: [{ id: 'oi005', productId: 'p011', styleNo: 'HT-001', productName: '基础圆领T恤', color: '黑色', size: 'M', warehouseId: 'wh1', warehouseName: '广西莉莉', availableStock: 400, quantity: 200, shippedQuantity: 100, unitPrice: 45, subtotal: 9000 }, { id: 'oi006', productId: 'p022', styleNo: 'HK-001', productName: '休闲卫衣', color: '灰色', size: 'L', warehouseId: 'wh1', warehouseName: '广西莉莉', availableStock: 280, quantity: 60, shippedQuantity: 30, unitPrice: 88, subtotal: 5280 }], notes: '' },
    { id: 'o004', orderNo: 'SO-2025-004', customerId: 'c008', customerName: 'Cape Town Clothing', country: 'South Africa', orderDate: '2025-07-20', totalAmount: 42500, paidAmount: 57500, unpaidAmount: 0, totalQuantity: 250, shippedQuantity: 250, pendingShipQuantity: 0, status: '已完成', presaveDeduction: 35000, finalReceivable: 0, items: [{ id: 'oi007', productId: 'p006', styleNo: 'HW-001', productName: 'A字连衣裙', color: '蓝色', size: 'M', warehouseId: 'wh2', warehouseName: '广西龙生', availableStock: 140, quantity: 100, shippedQuantity: 100, unitPrice: 120, subtotal: 12000 }, { id: 'oi008', productId: 'p026', styleNo: 'HQ-001', productName: '风衣外套', color: '卡其', size: 'L', warehouseId: 'wh3', warehouseName: '广西林生', availableStock: 180, quantity: 150, shippedQuantity: 150, unitPrice: 168, subtotal: 25200 }], notes: '' },
    { id: 'o005', orderNo: 'SO-2025-005', customerId: 'c013', customerName: 'Mombasa Traders', country: 'Kenya', orderDate: '2025-07-22', totalAmount: 26780, paidAmount: 18000, unpaidAmount: 8780, totalQuantity: 380, shippedQuantity: 140, pendingShipQuantity: 240, status: '部分发货', presaveDeduction: 0, finalReceivable: 8780, items: [{ id: 'oi009', productId: 'p011', styleNo: 'HT-001', productName: '基础圆领T恤', color: '白色', size: 'L', warehouseId: 'wh1', warehouseName: '广西莉莉', availableStock: 700, quantity: 200, shippedQuantity: 80, unitPrice: 45, subtotal: 9000 }, { id: 'oi010', productId: 'p014', styleNo: 'HT-004', productName: '长袖T恤', color: '白色', size: 'L', warehouseId: 'wh1', warehouseName: '广西莉莉', availableStock: 450, quantity: 180, shippedQuantity: 60, unitPrice: 55, subtotal: 9900 }], notes: '' },
  ];

  // Generate shipments
  const shipments: Shipment[] = [
    { id: 's001', shipmentNo: 'SH-2025-001', orderId: 'o001', orderNo: 'SO-2025-001', customerId: 'c001', customerName: 'AfriFashion Ltd', shipDate: '2025-07-15', warehouseId: 'wh1', warehouseName: '广西莉莉', logisticsMethod: '海运', trackingNo: 'CN-NG-001', totalItems: 150, totalAmount: 14250, items: [{ orderItemId: 'oi001', styleNo: 'HJ-001', color: '深蓝', size: 'M', orderQty: 200, shippedQty: 100, thisShipQty: 100, unitPrice: 85, thisShipAmount: 8500 }, { orderItemId: 'oi002', styleNo: 'HT-001', color: '白色', size: 'L', orderQty: 100, shippedQty: 50, thisShipQty: 50, unitPrice: 45, thisShipAmount: 2250 }], notes: '' },
    { id: 's002', shipmentNo: 'SH-2025-002', orderId: 'o002', orderNo: 'SO-2025-002', customerId: 'c002', customerName: 'Ghana Styles Co', shipDate: '2025-07-18', warehouseId: 'wh2', warehouseName: '广西龙生', logisticsMethod: '海运', trackingNo: 'CN-GH-001', totalItems: 100, totalAmount: 9840, items: [{ orderItemId: 'oi003', styleNo: 'HW-001', color: '红色', size: 'M', orderQty: 100, shippedQty: 60, thisShipQty: 60, unitPrice: 120, thisShipAmount: 7200 }, { orderItemId: 'oi004', styleNo: 'HL-001', color: '黑色', size: 'M', orderQty: 80, shippedQty: 40, thisShipQty: 40, unitPrice: 68, thisShipAmount: 2720 }], notes: '' },
  ];

  // Generate payments
  const payments: Payment[] = [
    { id: 'pm001', paymentNo: 'PM-2025-001', customerId: 'c001', customerName: 'AfriFashion Ltd', paymentDate: '2025-07-12', amount: 20000, method: '银行转账', relatedOrderId: 'o001', relatedOrderNo: 'SO-2025-001', voucher: '', allocatedAmount: 20000, depositAmount: 0, notes: '' },
    { id: 'pm002', paymentNo: 'PM-2025-002', customerId: 'c002', customerName: 'Ghana Styles Co', paymentDate: '2025-07-14', amount: 13000, method: '微信', relatedOrderId: 'o002', relatedOrderNo: 'SO-2025-002', voucher: '', allocatedAmount: 13000, depositAmount: 0, notes: '' },
    { id: 'pm003', paymentNo: 'PM-2025-003', customerId: 'c008', customerName: 'Cape Town Clothing', paymentDate: '2025-07-22', amount: 57500, method: '银行转账', relatedOrderId: 'o004', relatedOrderNo: 'SO-2025-004', voucher: '', allocatedAmount: 42500, depositAmount: 15000, notes: '多付款，超出部分计入预存余额' },
    { id: 'pm004', paymentNo: 'PM-2025-004', customerId: 'c005', customerName: 'Uganda Wholesale', paymentDate: '2025-07-16', amount: 17000, method: '支付宝', relatedOrderId: 'o003', relatedOrderNo: 'SO-2025-003', voucher: '', allocatedAmount: 17000, depositAmount: 0, notes: '' },
    { id: 'pm005', paymentNo: 'PM-2025-005', customerId: 'c013', customerName: 'Mombasa Traders', paymentDate: '2025-07-20', amount: 18000, method: '银行转账', relatedOrderId: 'o005', relatedOrderNo: 'SO-2025-005', voucher: '', allocatedAmount: 18000, depositAmount: 0, notes: '' },
  ];

  // Generate customer ledgers
  const customerLedgers: Record<string, CustomerLedger[]> = {
    'c001': [
      { id: 'cl001', date: '2025-07-10', businessType: '订单', docNo: 'SO-2025-001', description: '订单应收', increaseReceivable: 28560, receivedAmount: 0, balance: 28560, depositChange: 0, depositBalance: 0, notes: '' },
      { id: 'cl002', date: '2025-07-12', businessType: '收款', docNo: 'PM-2025-001', description: '客户付款', increaseReceivable: 0, receivedAmount: 20000, balance: 8560, depositChange: 0, depositBalance: 0, notes: '' },
    ],
    'c002': [
      { id: 'cl003', date: '2025-07-12', businessType: '订单', docNo: 'SO-2025-002', description: '订单应收', increaseReceivable: 19840, receivedAmount: 0, balance: 19840, depositChange: 0, depositBalance: 0, notes: '' },
      { id: 'cl004', date: '2025-07-14', businessType: '收款', docNo: 'PM-2025-002', description: '客户付款', increaseReceivable: 0, receivedAmount: 13000, balance: 6840, depositChange: 0, depositBalance: 0, notes: '' },
    ],
    'c008': [
      { id: 'cl005', date: '2025-07-20', businessType: '订单', docNo: 'SO-2025-004', description: '订单应收', increaseReceivable: 42500, receivedAmount: 0, balance: 42500, depositChange: 0, depositBalance: 0, notes: '' },
      { id: 'cl006', date: '2025-07-22', businessType: '收款', docNo: 'PM-2025-003', description: '客户付款', increaseReceivable: 0, receivedAmount: 57500, balance: 0, depositChange: 15000, depositBalance: 15000, notes: '多付款计入预存' },
    ],
  };

  return {
    storageVersion: 1,
    customers,
    products,
    warehouses,
    factories,
    productionBatches,
    factoryPayments,
    inventoryRecords,
    inventoryFlows,
    inventoryReservations: [],
    orders,
    shipments,
    payments,
    paymentAllocations: [],
    depositApplications: [],
    customerLedgers,
  };
}
