import { describe, expect, it } from 'vitest';
import {
  analyzeImport,
  applyImport,
  createAutomaticMapping,
  mapSpreadsheetRows,
  type DataImportType,
  type MappedImportRow,
} from '@/lib/data-import';
import { warehouses } from '@/lib/mock-data';
import { convertWhatsAppContacts } from '@/lib/data-import-file';
import { createEmptyBusinessState } from '@/lib/state/empty-state';
import type { BusinessState } from '@/lib/types/business';

function row(rowNumber: number, values: Record<string, string>): MappedImportRow {
  return { rowNumber, values };
}

function importRows(
  state: BusinessState,
  type: DataImportType,
  rows: MappedImportRow[],
): BusinessState {
  const analysis = analyzeImport(type, rows, state, 'replace');
  expect(analysis.errorRows).toBe(0);
  return applyImport(type, analysis.importableRows, state).state;
}

function createMasterDataState(): BusinessState {
  let state = createEmptyBusinessState(warehouses);
  state = importRows(state, 'customers', [
    row(2, {
      name: 'Lagos Fashion',
      country: '尼日利亚',
      city: 'Lagos',
      whatsapp: '+234 801 234 5678',
      frequentCategories: '连衣裙,套装',
      commonSizes: 'L,XL',
      notes: '',
    }),
  ]);
  state = importRows(state, 'products', [
    row(2, {
      styleNo: 'HL-001',
      name: '印花连衣裙',
      category: '连衣裙',
      colors: '红色,蓝色',
      sizes: 'L,XL',
      suggestedPrice: '128',
      lastCost: '60',
      newDate: '2026-07-31',
      status: '正常销售',
      description: '',
      notes: '',
    }),
  ]);
  return state;
}

describe('data import', () => {
  it('converts the first-sheet WhatsApp export into customer import rows', () => {
    const converted = convertWhatsAppContacts('WhatsApp Contacts', [
      ['Whatsapp联系人列表'],
      ['Whatsapp联系人列表'],
      [
        'country_code',
        'country_name',
        'phone_number',
        'formatted_phone',
        'is_my_contact',
        '备注名',
        '公开名',
        '是否business账号',
        '是否被拉黑',
        'labels',
      ],
      ['234', 'Nigeria', '2348000000001', '+234 800 000 0001', '1', '备注客户', '公开客户', '1', '0', 'VIP'],
      ['228', 'Togo', '22890000001', '+228 90 00 00 01', '1', '', '公开客户二', '0', 'false', ''],
      ['233', 'Ghana', '23320000001', '+233 20 000 0001', '1', '拉黑客户', 'Blocked', '0', '1', ''],
      ['', '', '', '', '', '', '', '', '0', ''],
    ]);

    expect(converted).not.toBeNull();
    expect(converted).toMatchObject({
      detectedFormat: 'whatsapp-contacts',
      sourceHeaderRow: 3,
      ignoredRows: 2,
      headers: ['客户名称', '国家', '城市', 'WhatsApp', '常买品类', '常用尺码', '备注'],
    });
    expect(converted?.rows).toEqual([
      ['备注客户', 'Nigeria', '', '+234 800 000 0001', '', '', 'WhatsApp标签：VIP；WhatsApp Business账号'],
      ['公开客户二', 'Togo', '', '+228 90 00 00 01', '', '', ''],
    ]);
  });

  it('automatically maps common Chinese column names and ignores extra columns', () => {
    const parsed = {
      sheetName: 'Sheet1',
      headers: ['客户名称', '国家', 'WhatsApp', '无关列'],
      rows: [['A', '尼日利亚', '+2341', 'ignored']],
    };
    const mapping = createAutomaticMapping('customers', parsed.headers);
    expect(mapping).toEqual({ 0: 'name', 1: 'country', 2: 'whatsapp', 3: 'skip' });
    expect(mapSpreadsheetRows(parsed, mapping)[0].values).toEqual({
      name: 'A',
      country: '尼日利亚',
      whatsapp: '+2341',
    });
  });

  it('imports and replaces customers by normalized WhatsApp number', () => {
    let state = createMasterDataState();
    state = importRows(state, 'customers', [
      row(2, {
        name: 'Lagos Fashion Updated',
        country: '尼日利亚',
        city: 'Abuja',
        whatsapp: '+2348012345678',
        frequentCategories: '套装',
        commonSizes: 'XL',
        notes: '更新',
      }),
    ]);
    expect(state.customers).toHaveLength(1);
    expect(state.customers[0]).toMatchObject({
      name: 'Lagos Fashion Updated',
      city: 'Abuja',
      frequentCategories: ['套装'],
    });
  });

  it('imports SKU stock and records an auditable inventory adjustment', () => {
    let state = createMasterDataState();
    state = importRows(state, 'inventory', [
      row(2, {
        styleNo: 'HL-001',
        color: '红色',
        size: 'L',
        warehouse: '广西莉莉',
        quantity: '120',
        date: '2026/07/31',
        notes: '期初盘点',
      }),
    ]);
    expect(state.inventoryRecords[0]).toMatchObject({
      actualStock: 120,
      reservedStock: 0,
      sellableStock: 120,
    });
    expect(state.inventoryFlows[0]).toMatchObject({
      type: '手工调整',
      quantity: 120,
      relatedDoc: 'DATA-IMPORT',
    });
  });

  it('adds opening receivables to customer summaries through the ledger', () => {
    let state = createMasterDataState();
    state = importRows(state, 'receivables', [
      row(2, {
        customerName: 'Lagos Fashion',
        whatsapp: '+2348012345678',
        openingReceivable: '3,500',
        presaveBalance: '500',
        date: '2026-07-31',
        notes: '旧系统',
      }),
    ]);
    expect(state.customers[0]).toMatchObject({
      orderReceivable: 3500,
      shippedDebt: 3500,
      presaveBalance: 500,
      status: '有欠款',
    });
    expect(state.customerLedgers[state.customers[0].id][0]).toMatchObject({
      businessType: '期初余额',
      increaseReceivable: 3500,
      depositBalance: 500,
    });
  });

  it('imports an active order, restores its reservation, then allocates a payment', () => {
    let state = createMasterDataState();
    state = importRows(state, 'inventory', [
      row(2, {
        styleNo: 'HL-001',
        color: '红色',
        size: 'L',
        warehouse: '广西莉莉',
        quantity: '120',
        date: '2026-07-31',
        notes: '',
      }),
    ]);
    state = importRows(state, 'orders', [
      row(2, {
        orderNo: 'SO-OLD-001',
        customerName: 'Lagos Fashion',
        customerWhatsapp: '+2348012345678',
        orderDate: '2026-07-20',
        styleNo: 'HL-001',
        color: '红色',
        size: 'L',
        warehouse: '广西莉莉',
        quantity: '100',
        shippedQuantity: '20',
        unitPrice: '10',
        paidAmount: '0',
        status: '部分发货',
        notes: '',
      }),
    ]);
    expect(state.orders[0]).toMatchObject({
      orderNo: 'SO-OLD-001',
      shippedQuantity: 20,
      pendingShipQuantity: 80,
      unpaidAmount: 1000,
    });
    expect(state.inventoryRecords[0].reservedStock).toBe(80);
    expect(state.inventoryReservations[0]).toMatchObject({
      reservedQuantity: 100,
      shippedQuantity: 20,
      status: '部分履行',
    });

    state = importRows(state, 'payments', [
      row(2, {
        paymentNo: 'PM-OLD-001',
        customerName: 'Lagos Fashion',
        customerWhatsapp: '+2348012345678',
        paymentDate: '2026-07-31',
        amount: '1200',
        method: '银行转账',
        relatedOrderNo: 'SO-OLD-001',
        voucher: '',
        notes: '',
      }),
    ]);
    expect(state.orders[0].paidAmount).toBe(1000);
    expect(state.orders[0].unpaidAmount).toBe(0);
    expect(state.payments[0]).toMatchObject({
      paymentNo: 'PM-OLD-001',
      allocatedAmount: 1000,
      depositAmount: 200,
    });
    expect(state.customers[0].presaveBalance).toBe(200);
  });

  it('skips existing identities when skip mode is selected', () => {
    const state = createMasterDataState();
    const analysis = analyzeImport('products', [
      row(2, {
        styleNo: 'HL-001',
        name: '重复商品',
        category: '连衣裙',
        colors: '红色',
        sizes: 'L',
      }),
    ], state, 'skip');
    expect(analysis.duplicateRows).toBe(1);
    expect(analysis.validRows).toBe(0);
  });
});
