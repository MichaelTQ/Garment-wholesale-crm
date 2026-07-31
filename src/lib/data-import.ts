import type {
  Customer,
  CustomerLedger,
  Factory,
  InventoryFlow,
  InventoryRecord,
  Order,
  Payment,
  Product,
} from '@/lib/mock-data';
import { createBusinessId, createPaymentTransaction, deriveBusinessState } from '@/lib/services/business';
import { calcInventoryStatus, calculateSellableStock } from '@/lib/services/inventory';
import type { BusinessState, InventoryReservation } from '@/lib/types/business';

export type DataImportType =
  | 'customers'
  | 'products'
  | 'receivables'
  | 'orders'
  | 'payments'
  | 'factories'
  | 'inventory';

export type DuplicateMode = 'skip' | 'replace';

export interface ImportField {
  key: string;
  label: string;
  required?: boolean;
  aliases: string[];
  example: string;
}

export interface ImportTypeConfig {
  id: DataImportType;
  label: string;
  icon: string;
  description: string;
  fields: ImportField[];
}

export interface ParsedSpreadsheet {
  sheetName: string;
  headers: string[];
  rows: string[][];
}

export interface MappedImportRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface ImportIssue {
  row: number;
  field: string;
  message: string;
  kind: 'error' | 'duplicate' | 'warning';
}

export interface ImportAnalysis {
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
  issues: ImportIssue[];
  importableRows: MappedImportRow[];
}

export interface ImportResult {
  state: BusinessState;
  imported: number;
  skipped: number;
}

const field = (
  key: string,
  label: string,
  example: string,
  required = false,
  aliases: string[] = [],
): ImportField => ({ key, label, example, required, aliases: [label, key, ...aliases] });

export const DATA_IMPORT_CONFIGS: Record<DataImportType, ImportTypeConfig> = {
  customers: {
    id: 'customers',
    label: '客户资料',
    icon: '👤',
    description: '按 WhatsApp 号码识别同一客户',
    fields: [
      field('name', '客户名称', 'Lagos Fashion', true, ['客户', '姓名']),
      field('country', '国家', '尼日利亚', true),
      field('city', '城市', 'Lagos'),
      field('whatsapp', 'WhatsApp', '+2348012345678', true, ['电话', '手机']),
      field('frequentCategories', '常买品类', '连衣裙,套装', false, ['品类']),
      field('commonSizes', '常用尺码', 'M,L,XL', false, ['尺码']),
      field('notes', '备注', '重点客户'),
    ],
  },
  products: {
    id: 'products',
    label: '商品资料',
    icon: '📦',
    description: '按款号识别同一商品',
    fields: [
      field('styleNo', '款号', 'HL-2026-001', true),
      field('name', '商品名称', '印花连衣裙', true, ['品名']),
      field('category', '分类', '连衣裙', true, ['品类']),
      field('colors', '颜色', '红色,蓝色', true),
      field('sizes', '尺码', 'M,L,XL', true),
      field('suggestedPrice', '建议售价', '128'),
      field('lastCost', '最近成本', '65'),
      field('newDate', '上新日期', '2026-07-31'),
      field('status', '状态', '正常销售'),
      field('description', '商品描述', '夏季新款'),
      field('notes', '备注', ''),
    ],
  },
  receivables: {
    id: 'receivables',
    label: '客户应收汇总',
    icon: '💰',
    description: '按客户写入期初应收和预存余额',
    fields: [
      field('customerName', '客户名称', 'Lagos Fashion', false, ['客户']),
      field('whatsapp', 'WhatsApp', '+2348012345678', false, ['电话']),
      field('openingReceivable', '期初应收', '3500', true, ['应收金额', '应收余额']),
      field('presaveBalance', '预存余额', '500', false, ['预存款']),
      field('date', '余额日期', '2026-07-31', true, ['日期']),
      field('notes', '备注', '旧系统迁入'),
    ],
  },
  orders: {
    id: 'orders',
    label: '历史订单',
    icon: '📋',
    description: '一行一个订单商品，同一订单号会自动合并',
    fields: [
      field('orderNo', '订单号', 'SO-OLD-0001', true),
      field('customerName', '客户名称', 'Lagos Fashion', false, ['客户']),
      field('customerWhatsapp', '客户WhatsApp', '+2348012345678', false, ['WhatsApp']),
      field('orderDate', '订单日期', '2026-07-20', true, ['日期']),
      field('styleNo', '款号', 'HL-2026-001', true),
      field('color', '颜色', '红色', true),
      field('size', '尺码', 'L', true),
      field('warehouse', '仓库', '广西莉莉', true),
      field('quantity', '数量', '100', true),
      field('shippedQuantity', '已发数量', '0'),
      field('unitPrice', '销售单价', '128', true, ['单价']),
      field('paidAmount', '订单已收', '0'),
      field('status', '订单状态', '草稿', false, ['状态']),
      field('notes', '备注', '历史订单'),
    ],
  },
  payments: {
    id: 'payments',
    label: '收款记录',
    icon: '💳',
    description: '优先核销关联订单，其余自动转为客户预存款',
    fields: [
      field('paymentNo', '收款单号', 'PM-OLD-0001', true),
      field('customerName', '客户名称', 'Lagos Fashion', false, ['客户']),
      field('customerWhatsapp', '客户WhatsApp', '+2348012345678', false, ['WhatsApp']),
      field('paymentDate', '收款日期', '2026-07-31', true, ['日期']),
      field('amount', '收款金额', '5000', true, ['金额']),
      field('method', '收款方式', '银行转账', false, ['方式']),
      field('relatedOrderNo', '关联订单号', 'SO-OLD-0001', false, ['订单号']),
      field('voucher', '凭证', ''),
      field('notes', '备注', '旧系统迁入'),
    ],
  },
  factories: {
    id: 'factories',
    label: '工厂资料',
    icon: '🏭',
    description: '按工厂名称识别同一工厂',
    fields: [
      field('name', '工厂名称', '广州某某制衣厂', true, ['工厂']),
      field('contact', '联系人', '张生'),
      field('phone', '联系电话', '13800000000', false, ['电话']),
      field('mainCategory', '主营品类', '连衣裙', false, ['品类']),
      field('address', '地址', '广州新塘'),
      field('notes', '备注', ''),
    ],
  },
  inventory: {
    id: 'inventory',
    label: '库存数据',
    icon: '📊',
    description: '按仓库、款号、颜色、尺码识别同一 SKU',
    fields: [
      field('styleNo', '款号', 'HL-2026-001', true),
      field('color', '颜色', '红色', true),
      field('size', '尺码', 'L', true),
      field('warehouse', '仓库', '广西莉莉', true),
      field('quantity', '数量', '100', true, ['实际库存']),
      field('date', '库存日期', '2026-07-31', false, ['日期']),
      field('notes', '备注', '盘点迁入'),
    ],
  },
};

export const DATA_IMPORT_TYPES = Object.values(DATA_IMPORT_CONFIGS);

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_\-（）()]/g, '');
}

export function createAutomaticMapping(
  type: DataImportType,
  headers: string[],
): Record<number, string> {
  const fields = DATA_IMPORT_CONFIGS[type].fields;
  return Object.fromEntries(
    headers.map((header, index) => {
      const normalized = normalizeHeader(header);
      const match = fields.find((item) =>
        item.aliases.some((alias) => normalizeHeader(alias) === normalized),
      );
      return [index, match?.key ?? 'skip'];
    }),
  );
}

export function mapSpreadsheetRows(
  parsed: ParsedSpreadsheet,
  mapping: Record<number, string>,
): MappedImportRow[] {
  return parsed.rows
    .map((row, index) => {
      const values: Record<string, string> = {};
      for (const [column, key] of Object.entries(mapping)) {
        if (key === 'skip') continue;
        values[key] = String(row[Number(column)] ?? '').trim();
      }
      return { rowNumber: index + 2, values };
    })
    .filter((row) => Object.values(row.values).some(Boolean));
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, '').toLowerCase();
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function splitList(value: string): string[] {
  return [...new Set(value.split(/[,，;；|/]/).map((item) => item.trim()).filter(Boolean))];
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return 0;
  const parsed = Number(value.replace(/[¥￥,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDate(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})[./年-](\d{1,2})[./月-](\d{1,2})日?$/);
  if (match) {
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${match[1]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const timestamp = Date.parse(trimmed);
  if (!Number.isFinite(timestamp)) return null;
  const parsed = new Date(timestamp);
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    String(parsed.getDate()).padStart(2, '0'),
  ].join('-');
}

function findCustomer(state: BusinessState, values: Record<string, string>): Customer | undefined {
  const phone = normalizePhone(values.customerWhatsapp || values.whatsapp || '');
  if (phone) {
    const match = state.customers.find((item) => normalizePhone(item.whatsapp) === phone);
    if (match) return match;
  }
  const name = normalizeKey(values.customerName || values.name || '');
  return name ? state.customers.find((item) => normalizeKey(item.name) === name) : undefined;
}

function findWarehouse(state: BusinessState, value: string) {
  const key = normalizeKey(value);
  return state.warehouses.find(
    (item) => normalizeKey(item.name) === key || normalizeKey(item.id) === key,
  );
}

function rowIdentity(type: DataImportType, row: MappedImportRow): string {
  const value = row.values;
  switch (type) {
    case 'customers':
      return normalizePhone(value.whatsapp);
    case 'products':
      return normalizeKey(value.styleNo);
    case 'receivables':
      return normalizePhone(value.whatsapp) || normalizeKey(value.customerName);
    case 'orders':
      return [
        normalizeKey(value.orderNo),
        normalizeKey(value.styleNo),
        normalizeKey(value.color),
        normalizeKey(value.size),
        normalizeKey(value.warehouse),
      ].join('|');
    case 'payments':
      return normalizeKey(value.paymentNo);
    case 'factories':
      return normalizeKey(value.name);
    case 'inventory':
      return [
        normalizeKey(value.warehouse),
        normalizeKey(value.styleNo),
        normalizeKey(value.color),
        normalizeKey(value.size),
      ].join('|');
  }
}

function groupOrderRows(rows: MappedImportRow[]): Map<string, MappedImportRow[]> {
  const grouped = new Map<string, MappedImportRow[]>();
  for (const row of rows) {
    const key = normalizeKey(row.values.orderNo);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  return grouped;
}

function existingIdentity(type: DataImportType, row: MappedImportRow, state: BusinessState): boolean {
  const value = row.values;
  switch (type) {
    case 'customers':
      return state.customers.some((item) => normalizePhone(item.whatsapp) === normalizePhone(value.whatsapp));
    case 'products':
      return state.products.some((item) => normalizeKey(item.styleNo) === normalizeKey(value.styleNo));
    case 'receivables': {
      const customer = findCustomer(state, value);
      return Boolean(
        customer && (state.customerLedgers[customer.id] ?? []).some((item) => item.businessType === '期初余额'),
      );
    }
    case 'orders':
      return state.orders.some((item) => normalizeKey(item.orderNo) === normalizeKey(value.orderNo));
    case 'payments':
      return state.payments.some((item) => normalizeKey(item.paymentNo) === normalizeKey(value.paymentNo));
    case 'factories':
      return state.factories.some((item) => normalizeKey(item.name) === normalizeKey(value.name));
    case 'inventory': {
      const warehouse = findWarehouse(state, value.warehouse);
      return Boolean(
        warehouse && state.inventoryRecords.some(
          (item) =>
            item.warehouseId === warehouse.id &&
            normalizeKey(item.styleNo) === normalizeKey(value.styleNo) &&
            normalizeKey(item.color) === normalizeKey(value.color) &&
            normalizeKey(item.size) === normalizeKey(value.size),
        ),
      );
    }
  }
}

const PRODUCT_STATUSES: Product['status'][] = ['设计中', '生产中', '已上新', '正常销售', '库存不足', '已停售'];
const ORDER_STATUSES: Order['status'][] = ['草稿', '待确认', '已确认', '部分发货', '已全部发货', '已完成', '已取消'];
const PAYMENT_METHODS: Payment['method'][] = ['银行转账', '微信', '支付宝', '现金', '其他'];

function validateRow(
  type: DataImportType,
  row: MappedImportRow,
  state: BusinessState,
): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const values = row.values;
  const add = (fieldName: string, message: string) => {
    issues.push({ row: row.rowNumber, field: fieldName, message, kind: 'error' });
  };
  for (const configField of DATA_IMPORT_CONFIGS[type].fields) {
    if (configField.required && !values[configField.key]?.trim()) {
      add(configField.label, '必填字段不能为空');
    }
  }

  const number = (key: string, label: string, options?: { integer?: boolean; positive?: boolean; nonNegative?: boolean }) => {
    if (!values[key]?.trim() && !DATA_IMPORT_CONFIGS[type].fields.find((item) => item.key === key)?.required) return;
    const parsed = parseNumber(values[key] ?? '');
    if (parsed === null) add(label, '必须是有效数字');
    else if (options?.integer && !Number.isInteger(parsed)) add(label, '必须是整数');
    else if (options?.positive && parsed <= 0) add(label, '必须大于 0');
    else if (options?.nonNegative && parsed < 0) add(label, '不能小于 0');
  };
  const date = (key: string, label: string) => {
    if (values[key]?.trim() && !normalizeDate(values[key])) add(label, '日期格式无效');
  };

  if (type === 'customers' && !normalizePhone(values.whatsapp ?? '')) add('WhatsApp', '号码格式无效');
  if (type === 'products') {
    number('suggestedPrice', '建议售价', { nonNegative: true });
    number('lastCost', '最近成本', { nonNegative: true });
    date('newDate', '上新日期');
    if (values.status && !PRODUCT_STATUSES.includes(values.status as Product['status'])) {
      add('状态', `可选值：${PRODUCT_STATUSES.join('、')}`);
    }
  }
  if (type === 'receivables') {
    if (!findCustomer(state, values)) add('客户', '未找到匹配客户，请先导入客户资料');
    number('openingReceivable', '期初应收', { nonNegative: true });
    number('presaveBalance', '预存余额', { nonNegative: true });
    date('date', '余额日期');
  }
  if (type === 'orders') {
    if (!findCustomer(state, values)) add('客户', '未找到匹配客户，请先导入客户资料');
    if (!state.products.some((item) => normalizeKey(item.styleNo) === normalizeKey(values.styleNo ?? ''))) {
      add('款号', '未找到匹配商品，请先导入商品资料');
    }
    if (!findWarehouse(state, values.warehouse ?? '')) add('仓库', '未找到匹配仓库');
    number('quantity', '数量', { integer: true, positive: true });
    number('shippedQuantity', '已发数量', { integer: true, nonNegative: true });
    number('unitPrice', '销售单价', { nonNegative: true });
    number('paidAmount', '订单已收', { nonNegative: true });
    date('orderDate', '订单日期');
    const quantity = parseNumber(values.quantity ?? '') ?? 0;
    const shipped = parseNumber(values.shippedQuantity ?? '') ?? 0;
    if (shipped > quantity) add('已发数量', '不能超过订单数量');
    if (values.status && !ORDER_STATUSES.includes(values.status as Order['status'])) {
      add('订单状态', `可选值：${ORDER_STATUSES.join('、')}`);
    }
  }
  if (type === 'payments') {
    const customer = findCustomer(state, values);
    if (!customer) add('客户', '未找到匹配客户，请先导入客户资料');
    number('amount', '收款金额', { positive: true });
    date('paymentDate', '收款日期');
    if (values.method && !PAYMENT_METHODS.includes(values.method as Payment['method'])) {
      add('收款方式', `可选值：${PAYMENT_METHODS.join('、')}`);
    }
    if (
      values.relatedOrderNo &&
      !state.orders.some(
        (item) =>
          normalizeKey(item.orderNo) === normalizeKey(values.relatedOrderNo) &&
          (!customer || item.customerId === customer.id),
      )
    ) {
      add('关联订单号', '未找到该客户的关联订单');
    }
  }
  if (type === 'inventory') {
    if (!state.products.some((item) => normalizeKey(item.styleNo) === normalizeKey(values.styleNo ?? ''))) {
      add('款号', '未找到匹配商品，请先导入商品资料');
    }
    if (!findWarehouse(state, values.warehouse ?? '')) add('仓库', '未找到匹配仓库');
    number('quantity', '数量', { integer: true, nonNegative: true });
    date('date', '库存日期');
  }
  return issues;
}

export function analyzeImport(
  type: DataImportType,
  rows: MappedImportRow[],
  state: BusinessState,
  duplicateMode: DuplicateMode,
): ImportAnalysis {
  const issues: ImportIssue[] = [];
  const errorRows = new Set<number>();
  const duplicateRows = new Set<number>();
  const seen = new Set<string>();

  for (const row of rows) {
    const rowIssues = validateRow(type, row, state);
    issues.push(...rowIssues);
    if (rowIssues.some((item) => item.kind === 'error')) errorRows.add(row.rowNumber);

    const identity = rowIdentity(type, row);
    if (seen.has(identity)) {
      // 同一订单可由多行商品组成；只有完全相同的订单商品行才算重复。
      duplicateRows.add(row.rowNumber);
      issues.push({ row: row.rowNumber, field: '唯一标识', message: '文件内存在重复数据', kind: 'duplicate' });
    } else {
      seen.add(identity);
    }
    if (existingIdentity(type, row, state)) {
      duplicateRows.add(row.rowNumber);
      issues.push({ row: row.rowNumber, field: '唯一标识', message: '系统中已存在，将按所选重复策略处理', kind: 'duplicate' });
    }
  }

  if (type === 'orders') {
    for (const group of groupOrderRows(rows).values()) {
      const first = group[0];
      const consistentFields = [
        ['customerName', '客户名称'],
        ['customerWhatsapp', '客户WhatsApp'],
        ['orderDate', '订单日期'],
        ['paidAmount', '订单已收'],
        ['status', '订单状态'],
      ] as const;
      for (const current of group.slice(1)) {
        for (const [key, label] of consistentFields) {
          if (normalizeKey(current.values[key] ?? '') !== normalizeKey(first.values[key] ?? '')) {
            errorRows.add(current.rowNumber);
            issues.push({
              row: current.rowNumber,
              field: label,
              message: '同一订单号的订单级字段必须保持一致',
              kind: 'error',
            });
          }
        }
      }
      const totalAmount = group.reduce(
        (sum, current) =>
          sum +
          (parseNumber(current.values.quantity ?? '') ?? 0) *
          (parseNumber(current.values.unitPrice ?? '') ?? 0),
        0,
      );
      const paidAmount = parseNumber(first.values.paidAmount ?? '') ?? 0;
      if (paidAmount > totalAmount) {
        errorRows.add(first.rowNumber);
        issues.push({
          row: first.rowNumber,
          field: '订单已收',
          message: '不能超过订单商品总金额',
          kind: 'error',
        });
      }
    }
  }

  const importableRows = rows.filter(
    (row) =>
      !errorRows.has(row.rowNumber) &&
      !(duplicateMode === 'skip' && duplicateRows.has(row.rowNumber)),
  );
  return {
    totalRows: rows.length,
    validRows: importableRows.length,
    errorRows: errorRows.size,
    duplicateRows: duplicateRows.size,
    issues: issues.slice(0, 200),
    importableRows,
  };
}

function createCustomer(values: Record<string, string>, existing?: Customer): Customer {
  const categories = splitList(values.frequentCategories ?? '');
  return {
    id: existing?.id ?? createBusinessId('cus'),
    name: values.name.trim(),
    country: values.country.trim(),
    city: values.city?.trim() ?? '',
    whatsapp: values.whatsapp.trim(),
    categories,
    frequentCategories: categories,
    lastPurchaseDate: existing?.lastPurchaseDate ?? '',
    totalSales: existing?.totalSales ?? 0,
    orderReceivable: existing?.orderReceivable ?? 0,
    shippedDebt: existing?.shippedDebt ?? 0,
    presaveBalance: existing?.presaveBalance ?? 0,
    preDeposit: existing?.preDeposit ?? 0,
    lastPaymentDate: existing?.lastPaymentDate ?? '',
    pendingShipQty: existing?.pendingShipQty ?? 0,
    status: existing?.status ?? '一般',
    commonSizes: splitList(values.commonSizes ?? ''),
    avgOrderAmount: existing?.avgOrderAmount ?? 0,
    purchaseFrequency: existing?.purchaseFrequency ?? '',
    notes: values.notes?.trim() ?? '',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
}

function createProduct(values: Record<string, string>, existing?: Product): Product {
  const colors = splitList(values.colors ?? '').map((name) => ({ name, hex: '#9ca3af' }));
  return {
    id: existing?.id ?? createBusinessId('pro'),
    styleNo: values.styleNo.trim(),
    name: values.name.trim(),
    category: values.category.trim(),
    colors,
    sizes: splitList(values.sizes ?? ''),
    images: existing?.images ?? [],
    currentStock: existing?.currentStock ?? 0,
    suggestedPrice: parseNumber(values.suggestedPrice ?? '') ?? 0,
    lastCost: parseNumber(values.lastCost ?? '') ?? 0,
    newDate: normalizeDate(values.newDate ?? '') ?? '',
    status: (values.status || existing?.status || '正常销售') as Product['status'],
    description: values.description?.trim() ?? '',
    notes: values.notes?.trim() ?? '',
  };
}

function applyCustomers(state: BusinessState, rows: MappedImportRow[]): BusinessState {
  const next = structuredClone(state);
  for (const row of rows) {
    const index = next.customers.findIndex(
      (item) => normalizePhone(item.whatsapp) === normalizePhone(row.values.whatsapp),
    );
    const customer = createCustomer(row.values, index >= 0 ? next.customers[index] : undefined);
    if (index >= 0) next.customers[index] = customer;
    else {
      next.customers.push(customer);
      next.customerLedgers[customer.id] = [];
    }
  }
  return deriveBusinessState(next);
}

function applyProducts(state: BusinessState, rows: MappedImportRow[]): BusinessState {
  const next = structuredClone(state);
  for (const row of rows) {
    const index = next.products.findIndex(
      (item) => normalizeKey(item.styleNo) === normalizeKey(row.values.styleNo),
    );
    const product = createProduct(row.values, index >= 0 ? next.products[index] : undefined);
    if (index >= 0) next.products[index] = product;
    else next.products.push(product);
  }
  return deriveBusinessState(next);
}

function applyFactories(state: BusinessState, rows: MappedImportRow[]): BusinessState {
  const next = structuredClone(state);
  for (const row of rows) {
    const index = next.factories.findIndex(
      (item) => normalizeKey(item.name) === normalizeKey(row.values.name),
    );
    const existing = index >= 0 ? next.factories[index] : undefined;
    const factory: Factory = {
      id: existing?.id ?? createBusinessId('fac'),
      name: row.values.name.trim(),
      contact: row.values.contact?.trim() ?? '',
      phone: row.values.phone?.trim() ?? '',
      mainCategory: row.values.mainCategory?.trim() ?? '',
      totalProductionAmount: existing?.totalProductionAmount ?? 0,
      paidAmount: existing?.paidAmount ?? 0,
      unpaidAmount: existing?.unpaidAmount ?? 0,
      lastCoopDate: existing?.lastCoopDate ?? '',
      address: row.values.address?.trim() ?? '',
      notes: row.values.notes?.trim() ?? '',
    };
    if (index >= 0) next.factories[index] = factory;
    else next.factories.push(factory);
  }
  return deriveBusinessState(next);
}

function applyInventory(state: BusinessState, rows: MappedImportRow[]): BusinessState {
  const next = structuredClone(state);
  for (const row of rows) {
    const product = next.products.find(
      (item) => normalizeKey(item.styleNo) === normalizeKey(row.values.styleNo),
    );
    const warehouse = findWarehouse(next, row.values.warehouse);
    if (!product || !warehouse) throw new Error(`第 ${row.rowNumber} 行引用的商品或仓库不存在`);
    const index = next.inventoryRecords.findIndex(
      (item) =>
        item.warehouseId === warehouse.id &&
        normalizeKey(item.styleNo) === normalizeKey(product.styleNo) &&
        normalizeKey(item.color) === normalizeKey(row.values.color) &&
        normalizeKey(item.size) === normalizeKey(row.values.size),
    );
    const quantity = parseNumber(row.values.quantity) ?? 0;
    const before = index >= 0 ? next.inventoryRecords[index].actualStock : 0;
    const reserved = index >= 0 ? next.inventoryRecords[index].reservedStock : 0;
    if (quantity < reserved) {
      throw new Error(`第 ${row.rowNumber} 行库存不能低于已预留数量 ${reserved}`);
    }
    const record: InventoryRecord = {
      id: index >= 0 ? next.inventoryRecords[index].id : createBusinessId('inv'),
      styleNo: product.styleNo,
      productName: product.name,
      color: row.values.color.trim(),
      size: row.values.size.trim(),
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      actualStock: quantity,
      reservedStock: reserved,
      sellableStock: calculateSellableStock(quantity, reserved),
      status: calcInventoryStatus(calculateSellableStock(quantity, reserved)),
    };
    if (index >= 0) next.inventoryRecords[index] = record;
    else next.inventoryRecords.push(record);
    if (quantity !== before) {
      const flow: InventoryFlow = {
        id: createBusinessId('if'),
        date: normalizeDate(row.values.date ?? '') ?? new Date().toISOString().slice(0, 10),
        type: '手工调整',
        product: product.name,
        styleNo: product.styleNo,
        color: record.color,
        size: record.size,
        warehouse: warehouse.name,
        quantity: quantity - before,
        beforeStock: before,
        afterStock: quantity,
        relatedDoc: 'DATA-IMPORT',
        notes: row.values.notes?.trim() || '数据迁入库存调整',
      };
      next.inventoryFlows.unshift(flow);
    }
  }
  return deriveBusinessState(next);
}

function applyReceivables(state: BusinessState, rows: MappedImportRow[]): BusinessState {
  const next = structuredClone(state);
  for (const row of rows) {
    const customer = findCustomer(next, row.values);
    if (!customer) throw new Error(`第 ${row.rowNumber} 行客户不存在`);
    const openingReceivable = parseNumber(row.values.openingReceivable) ?? 0;
    const presaveBalance = parseNumber(row.values.presaveBalance ?? '') ?? 0;
    const existingEntries = next.customerLedgers[customer.id] ?? [];
    const keptEntries = existingEntries.filter((item) => item.businessType !== '期初余额');
    customer.presaveBalance = presaveBalance;
    customer.preDeposit = presaveBalance;
    const entry: CustomerLedger = {
      id: createBusinessId('led'),
      date: normalizeDate(row.values.date) ?? row.values.date,
      businessType: '期初余额',
      docNo: `OPEN-${customer.id}`.slice(0, 20),
      description: '数据迁入期初余额',
      increaseReceivable: openingReceivable,
      receivedAmount: 0,
      balance: openingReceivable,
      depositChange: presaveBalance,
      depositBalance: presaveBalance,
      notes: row.values.notes?.trim() ?? '',
    };
    next.customerLedgers[customer.id] = [entry, ...keptEntries];
  }
  return deriveBusinessState(next);
}

function removeOrderForReplacement(state: BusinessState, orderNo: string): void {
  const existing = state.orders.find((item) => normalizeKey(item.orderNo) === normalizeKey(orderNo));
  if (!existing) return;
  if (state.shipments.some((item) => item.orderId === existing.id)) {
    throw new Error(`订单 ${orderNo} 已有关联发货记录，不能覆盖`);
  }
  if (state.paymentAllocations.some((item) => item.orderId === existing.id)) {
    throw new Error(`订单 ${orderNo} 已有关联收款，不能覆盖`);
  }
  for (const reservation of state.inventoryReservations.filter((item) => item.orderId === existing.id)) {
    const remaining = Math.max(0, reservation.reservedQuantity - reservation.shippedQuantity - reservation.releasedQuantity);
    const record = state.inventoryRecords.find(
      (item) =>
        item.warehouseId === reservation.warehouseId &&
        item.styleNo === reservation.styleNo &&
        item.color === reservation.color &&
        item.size === reservation.size,
    );
    if (record) record.reservedStock = Math.max(0, record.reservedStock - remaining);
  }
  state.orders = state.orders.filter((item) => item.id !== existing.id);
  state.inventoryReservations = state.inventoryReservations.filter((item) => item.orderId !== existing.id);
  state.inventoryFlows = state.inventoryFlows.filter((item) => item.relatedDoc !== existing.orderNo);
  state.customerLedgers[existing.customerId] = (state.customerLedgers[existing.customerId] ?? []).filter(
    (item) => item.docNo !== existing.orderNo,
  );
}

function applyOrders(state: BusinessState, rows: MappedImportRow[]): BusinessState {
  const next = structuredClone(state);
  const grouped = groupOrderRows(rows);
  for (const group of grouped.values()) {
    const first = group[0];
    removeOrderForReplacement(next, first.values.orderNo);
    const customer = findCustomer(next, first.values);
    if (!customer) throw new Error(`第 ${first.rowNumber} 行客户不存在`);
    const orderId = createBusinessId('ord');
    const orderItems: Order['items'] = [];
    let totalPaid = parseNumber(first.values.paidAmount ?? '') ?? 0;
    for (const row of group) {
      const product = next.products.find(
        (item) => normalizeKey(item.styleNo) === normalizeKey(row.values.styleNo),
      );
      const warehouse = findWarehouse(next, row.values.warehouse);
      if (!product || !warehouse) throw new Error(`第 ${row.rowNumber} 行引用的商品或仓库不存在`);
      const quantity = parseNumber(row.values.quantity) ?? 0;
      const shippedQuantity = parseNumber(row.values.shippedQuantity ?? '') ?? 0;
      const unitPrice = parseNumber(row.values.unitPrice) ?? 0;
      orderItems.push({
        id: createBusinessId('oi'),
        productId: product.id,
        styleNo: product.styleNo,
        productName: product.name,
        color: row.values.color.trim(),
        size: row.values.size.trim(),
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        availableStock: 0,
        quantity,
        shippedQuantity,
        unitPrice,
        subtotal: quantity * unitPrice,
      });
    }
    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    totalPaid = Math.min(totalPaid, totalAmount);
    const status = (first.values.status || '草稿') as Order['status'];
    const order: Order = {
      id: orderId,
      orderNo: first.values.orderNo.trim(),
      customerId: customer.id,
      customerName: customer.name,
      country: customer.country,
      orderDate: normalizeDate(first.values.orderDate) ?? first.values.orderDate,
      items: orderItems,
      totalAmount,
      paidAmount: totalPaid,
      unpaidAmount: Math.max(0, totalAmount - totalPaid),
      totalQuantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      shippedQuantity: orderItems.reduce((sum, item) => sum + item.shippedQuantity, 0),
      pendingShipQuantity: orderItems.reduce((sum, item) => sum + item.quantity - item.shippedQuantity, 0),
      status,
      presaveDeduction: 0,
      finalReceivable: Math.max(0, totalAmount - totalPaid),
      notes: first.values.notes?.trim() ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const active = ['已确认', '部分发货', '已全部发货', '已完成'].includes(status);
    if (active) {
      for (const item of orderItems) {
        const remaining = item.quantity - item.shippedQuantity;
        if (remaining <= 0) continue;
        const stock = next.inventoryRecords.find(
          (record) =>
            record.warehouseId === item.warehouseId &&
            normalizeKey(record.styleNo) === normalizeKey(item.styleNo) &&
            normalizeKey(record.color) === normalizeKey(item.color) &&
            normalizeKey(record.size) === normalizeKey(item.size),
        );
        if (!stock || stock.actualStock - stock.reservedStock < remaining) {
          throw new Error(`${order.orderNo} 的 ${item.styleNo} ${item.color}/${item.size} 可销售库存不足`);
        }
        const before = stock.reservedStock;
        stock.reservedStock += remaining;
        item.availableStock = stock.actualStock - before;
        const reservation: InventoryReservation = {
          id: createBusinessId('res'),
          orderId,
          orderItemId: item.id,
          customerId: customer.id,
          warehouseId: item.warehouseId,
          styleNo: item.styleNo,
          color: item.color,
          size: item.size,
          reservedQuantity: item.quantity,
          shippedQuantity: item.shippedQuantity,
          releasedQuantity: 0,
          status: item.shippedQuantity > 0 ? '部分履行' : '有效',
          reservedAt: order.createdAt ?? '',
          releasedAt: '',
        };
        next.inventoryReservations.push(reservation);
        next.inventoryFlows.unshift({
          id: createBusinessId('if'),
          date: order.orderDate,
          type: '库存预留',
          product: item.productName,
          styleNo: item.styleNo,
          color: item.color,
          size: item.size,
          warehouse: item.warehouseName,
          quantity: remaining,
          beforeStock: before,
          afterStock: stock.reservedStock,
          relatedDoc: order.orderNo,
          notes: '历史订单迁入，恢复待发库存预留',
        });
      }
      const ledger: CustomerLedger = {
        id: createBusinessId('led'),
        date: order.orderDate,
        businessType: '订单',
        docNo: order.orderNo,
        description: `迁入历史订单 ${order.orderNo}`,
        increaseReceivable: totalAmount,
        receivedAmount: totalPaid,
        balance: Math.max(0, totalAmount - totalPaid),
        depositChange: 0,
        depositBalance: customer.presaveBalance,
        notes: order.notes,
      };
      next.customerLedgers[customer.id] = [ledger, ...(next.customerLedgers[customer.id] ?? [])];
    }
    next.orders.push(order);
  }
  return deriveBusinessState(next);
}

function removePaymentForReplacement(state: BusinessState, paymentNo: string): void {
  const payment = state.payments.find((item) => normalizeKey(item.paymentNo) === normalizeKey(paymentNo));
  if (!payment) return;
  const allocations = state.paymentAllocations.filter((item) => item.paymentId === payment.id);
  for (const allocation of allocations) {
    const order = state.orders.find((item) => item.id === allocation.orderId);
    if (order) order.paidAmount = Math.max(0, order.paidAmount - allocation.amount);
  }
  const customer = state.customers.find((item) => item.id === payment.customerId);
  if (customer) customer.presaveBalance = Math.max(0, customer.presaveBalance - payment.depositAmount);
  state.paymentAllocations = state.paymentAllocations.filter((item) => item.paymentId !== payment.id);
  state.payments = state.payments.filter((item) => item.id !== payment.id);
  state.customerLedgers[payment.customerId] = (state.customerLedgers[payment.customerId] ?? []).filter(
    (item) => item.docNo !== payment.paymentNo,
  );
}

function applyPayments(state: BusinessState, rows: MappedImportRow[]): BusinessState {
  let next = structuredClone(state);
  for (const row of rows) {
    removePaymentForReplacement(next, row.values.paymentNo);
    const customer = findCustomer(next, row.values);
    if (!customer) throw new Error(`第 ${row.rowNumber} 行客户不存在`);
    const relatedOrder = next.orders.find(
      (item) =>
        item.customerId === customer.id &&
        normalizeKey(item.orderNo) === normalizeKey(row.values.relatedOrderNo ?? ''),
    );
    const createdAt = new Date().toISOString();
    const result = createPaymentTransaction(next, {
      customerId: customer.id,
      paymentDate: normalizeDate(row.values.paymentDate) ?? row.values.paymentDate,
      amount: parseNumber(row.values.amount) ?? 0,
      method: (row.values.method || '其他') as Payment['method'],
      relatedOrderId: relatedOrder?.id ?? '',
      voucher: row.values.voucher?.trim() ?? '',
      notes: row.values.notes?.trim() ?? '',
    }, createdAt);
    next = result.state;
    const imported = next.payments.find((item) => item.id === result.paymentId);
    if (imported) {
      const generatedNo = imported.paymentNo;
      imported.paymentNo = row.values.paymentNo.trim();
      next.customerLedgers[customer.id] = (next.customerLedgers[customer.id] ?? []).map((item) =>
        item.docNo === generatedNo ? { ...item, docNo: imported.paymentNo } : item,
      );
    }
  }
  return deriveBusinessState(next);
}

export function applyImport(
  type: DataImportType,
  rows: MappedImportRow[],
  state: BusinessState,
): ImportResult {
  let next: BusinessState;
  switch (type) {
    case 'customers':
      next = applyCustomers(state, rows);
      break;
    case 'products':
      next = applyProducts(state, rows);
      break;
    case 'receivables':
      next = applyReceivables(state, rows);
      break;
    case 'orders':
      next = applyOrders(state, rows);
      break;
    case 'payments':
      next = applyPayments(state, rows);
      break;
    case 'factories':
      next = applyFactories(state, rows);
      break;
    case 'inventory':
      next = applyInventory(state, rows);
      break;
  }
  return { state: next, imported: rows.length, skipped: 0 };
}

export function templateRows(type: DataImportType): string[][] {
  const config = DATA_IMPORT_CONFIGS[type];
  return [
    config.fields.map((item) => item.label),
    config.fields.map((item) => item.example),
  ];
}
