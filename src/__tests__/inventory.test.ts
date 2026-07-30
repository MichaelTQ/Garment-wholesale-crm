import { describe, it, expect } from 'vitest';
import {
  registerProductionInbound,
  registerManualInbound,
  calculateSellableStock,
  getRemainingInboundQuantity,
  canBatchInbound,
  getInventoryKey,
} from '@/lib/services/inventory';
import type { ProductionBatch, InventoryRecord, InventoryFlow, Warehouse } from '@/lib/mock-data';
import type { ProductionInboundCommand, ManualInboundCommand } from '@/lib/types/inventory';

const testWarehouses: Warehouse[] = [
  { id: 'w1', name: '广州白云仓', address: '白云区' },
  { id: 'w2', name: '广州番禺仓', address: '番禺区' },
];

function makeBatch(overrides: Partial<ProductionBatch> = {}): ProductionBatch {
  return {
    id: 'b001',
    batchNo: 'PB-2025-001',
    factoryId: 'f001',
    factoryName: '广州华美制衣厂',
    productId: 'p001',
    styleNo: 'HD-2025-001',
    productName: '经典直筒牛仔裤',
    color: '深蓝',
    size: 'M',
    quantity: 1000,
    unitCost: 45,
    totalCost: 45000,
    inboundWarehouseId: 'w1',
    warehouseId: 'w1',
    warehouseName: '广州白云仓',
    inboundDate: '',
    paidAmount: 20000,
    unpaidAmount: 25000,
    inboundQuantity: 0,
    status: '待入库',
    ...overrides,
  };
}

function makeInventoryRecord(overrides: Partial<InventoryRecord> = {}): InventoryRecord {
  return {
    id: 'inv-1',
    warehouseId: 'w1',
    warehouseName: '广州白云仓',
    styleNo: 'HD-2025-001',
    productName: '经典直筒牛仔裤',
    color: '深蓝',
    size: 'M',
    actualStock: 100,
    reservedStock: 20,
    sellableStock: 80,
    status: '正常',
    ...overrides,
  };
}

function makeState(overrides: Partial<{
  inventoryRecords: InventoryRecord[];
  productionBatches: ProductionBatch[];
  inventoryFlows: InventoryFlow[];
}> = {}) {
  return {
    inventoryRecords: [] as InventoryRecord[],
    productionBatches: [] as ProductionBatch[],
    inventoryFlows: [] as InventoryFlow[],
    ...overrides,
  };
}

describe('calculateSellableStock', () => {
  it('正确计算可销售库存', () => {
    expect(calculateSellableStock(100, 20)).toBe(80);
  });

  it('实际库存小于预留时返回0', () => {
    expect(calculateSellableStock(10, 20)).toBe(0);
  });
});

describe('getRemainingInboundQuantity', () => {
  it('未入库时返回全部生产数量', () => {
    expect(getRemainingInboundQuantity(makeBatch({ quantity: 1000, inboundQuantity: 0 }))).toBe(1000);
  });

  it('部分入库时返回剩余', () => {
    expect(getRemainingInboundQuantity(makeBatch({ quantity: 1000, inboundQuantity: 600 }))).toBe(400);
  });

  it('全部入库时返回0', () => {
    expect(getRemainingInboundQuantity(makeBatch({ quantity: 1000, inboundQuantity: 1000 }))).toBe(0);
  });
});

describe('canBatchInbound', () => {
  it('待入库批次可以入库', () => {
    expect(canBatchInbound(makeBatch({ status: '待入库' }))).toBe(true);
  });

  it('生产中批次可以入库', () => {
    expect(canBatchInbound(makeBatch({ status: '生产中' }))).toBe(true);
  });

  it('部分入库批次可以入库', () => {
    expect(canBatchInbound(makeBatch({ status: '部分入库', inboundQuantity: 500, quantity: 1000 }))).toBe(true);
  });

  it('已入库批次不能入库', () => {
    expect(canBatchInbound(makeBatch({ status: '已入库', inboundQuantity: 1000, quantity: 1000 }))).toBe(false);
  });

  it('已取消批次不能入库', () => {
    expect(canBatchInbound(makeBatch({ status: '已取消' }))).toBe(false);
  });

  it('已结清批次不能入库', () => {
    expect(canBatchInbound(makeBatch({ status: '已结清' }))).toBe(false);
  });
});

describe('getInventoryKey', () => {
  it('生成正确的库存匹配键', () => {
    expect(getInventoryKey('w1', 'HD-2025-001', '深蓝', 'M')).toBe('w1|HD-2025-001|深蓝|M');
  });
});

describe('registerProductionInbound', () => {
  it('1. 首次生产入库', () => {
    const batch = makeBatch({ quantity: 1000, inboundQuantity: 0, status: '待入库' });
    const state = makeState({
      productionBatches: [batch],
      inventoryRecords: [makeInventoryRecord({ actualStock: 100, reservedStock: 20, sellableStock: 80 })],
    });
    const cmd: ProductionInboundCommand = {
      type: '生产入库',
      batchId: 'b001',
      warehouseId: 'w1',
      quantity: 300,
      date: '2025-07-25',
      notes: '首批入库',
    };
    const result = registerProductionInbound(state, cmd, testWarehouses);
    expect(result.inventoryRecords[0].actualStock).toBe(400);
    expect(result.inventoryRecords[0].reservedStock).toBe(20);
    expect(result.inventoryRecords[0].sellableStock).toBe(380);
    expect(result.updatedBatch!.inboundQuantity).toBe(300);
    expect(result.updatedBatch!.status).toBe('部分入库');
    expect(result.newFlow.type).toBe('生产入库');
    expect(result.newFlow.quantity).toBe(300);
    expect(result.newFlow.beforeStock).toBe(100);
    expect(result.newFlow.afterStock).toBe(400);
    expect(result.newFlow.relatedDoc).toBe('PB-2025-001');
  });

  it('2. 同一批次分两次入库', () => {
    const batch = makeBatch({ quantity: 1000, inboundQuantity: 300, status: '部分入库' });
    const state = makeState({
      productionBatches: [batch],
      inventoryRecords: [makeInventoryRecord({ actualStock: 400, reservedStock: 20, sellableStock: 380 })],
    });
    const cmd: ProductionInboundCommand = {
      type: '生产入库',
      batchId: 'b001',
      warehouseId: 'w1',
      quantity: 700,
      date: '2025-07-28',
      notes: '第二批入库',
    };
    const result = registerProductionInbound(state, cmd, testWarehouses);
    expect(result.updatedBatch!.inboundQuantity).toBe(1000);
    expect(result.updatedBatch!.status).toBe('已入库');
    expect(result.inventoryRecords[0].actualStock).toBe(1100);
    expect(result.newFlow.beforeStock).toBe(400);
    expect(result.newFlow.afterStock).toBe(1100);
  });

  it('3. 部分入库状态', () => {
    const batch = makeBatch({ quantity: 1000, inboundQuantity: 0, status: '待入库' });
    const state = makeState({
      productionBatches: [batch],
      inventoryRecords: [makeInventoryRecord()],
    });
    const cmd: ProductionInboundCommand = {
      type: '生产入库', batchId: 'b001', warehouseId: 'w1', quantity: 500, date: '2025-07-25', notes: '',
    };
    const result = registerProductionInbound(state, cmd, testWarehouses);
    expect(result.updatedBatch!.status).toBe('部分入库');
  });

  it('4. 全部入库状态', () => {
    const batch = makeBatch({ quantity: 1000, inboundQuantity: 0, status: '待入库' });
    const state = makeState({
      productionBatches: [batch],
      inventoryRecords: [makeInventoryRecord()],
    });
    const cmd: ProductionInboundCommand = {
      type: '生产入库', batchId: 'b001', warehouseId: 'w1', quantity: 1000, date: '2025-07-25', notes: '',
    };
    const result = registerProductionInbound(state, cmd, testWarehouses);
    expect(result.updatedBatch!.status).toBe('已入库');
  });

  it('5. 超量入库被拒绝', () => {
    const batch = makeBatch({ quantity: 1000, inboundQuantity: 600, status: '部分入库' });
    const state = makeState({ productionBatches: [batch] });
    const cmd: ProductionInboundCommand = {
      type: '生产入库', batchId: 'b001', warehouseId: 'w1', quantity: 500, date: '2025-07-25', notes: '',
    };
    expect(() => registerProductionInbound(state, cmd, testWarehouses)).toThrow('本次入库数量不能超过剩余可入库数量 400 件');
  });

  it('6. 已完成批次不能继续入库', () => {
    const batch = makeBatch({ quantity: 1000, inboundQuantity: 1000, status: '已入库' });
    const state = makeState({ productionBatches: [batch] });
    const cmd: ProductionInboundCommand = {
      type: '生产入库', batchId: 'b001', warehouseId: 'w1', quantity: 100, date: '2025-07-25', notes: '',
    };
    expect(() => registerProductionInbound(state, cmd, testWarehouses)).toThrow('该生产批次已完成或已取消，无法继续入库');
  });

  it('7. 入库增加实际库存', () => {
    const batch = makeBatch({ quantity: 500, inboundQuantity: 0, status: '待入库' });
    const record = makeInventoryRecord({ actualStock: 50, reservedStock: 10, sellableStock: 40 });
    const state = makeState({ productionBatches: [batch], inventoryRecords: [record] });
    const cmd: ProductionInboundCommand = {
      type: '生产入库', batchId: 'b001', warehouseId: 'w1', quantity: 200, date: '2025-07-25', notes: '',
    };
    const result = registerProductionInbound(state, cmd, testWarehouses);
    expect(result.inventoryRecords[0].actualStock).toBe(250);
  });

  it('8. 入库不改变预留库存', () => {
    const batch = makeBatch({ quantity: 500, inboundQuantity: 0, status: '待入库' });
    const record = makeInventoryRecord({ actualStock: 50, reservedStock: 10, sellableStock: 40 });
    const state = makeState({ productionBatches: [batch], inventoryRecords: [record] });
    const cmd: ProductionInboundCommand = {
      type: '生产入库', batchId: 'b001', warehouseId: 'w1', quantity: 200, date: '2025-07-25', notes: '',
    };
    const result = registerProductionInbound(state, cmd, testWarehouses);
    expect(result.inventoryRecords[0].reservedStock).toBe(10);
  });

  it('9. 可销售库存正确更新', () => {
    const batch = makeBatch({ quantity: 500, inboundQuantity: 0, status: '待入库' });
    const record = makeInventoryRecord({ actualStock: 50, reservedStock: 10, sellableStock: 40 });
    const state = makeState({ productionBatches: [batch], inventoryRecords: [record] });
    const cmd: ProductionInboundCommand = {
      type: '生产入库', batchId: 'b001', warehouseId: 'w1', quantity: 200, date: '2025-07-25', notes: '',
    };
    const result = registerProductionInbound(state, cmd, testWarehouses);
    expect(result.inventoryRecords[0].sellableStock).toBe(240);
  });

  it('10. 新仓库/SKU库存记录自动创建', () => {
    const batch = makeBatch({
      quantity: 500, inboundQuantity: 0, status: '待入库',
      inboundWarehouseId: 'w2',
    });
    const record = makeInventoryRecord({ warehouseId: 'w1', warehouseName: '广州白云仓' });
    const state = makeState({ productionBatches: [batch], inventoryRecords: [record] });
    const cmd: ProductionInboundCommand = {
      type: '生产入库', batchId: 'b001', warehouseId: 'w2', quantity: 200, date: '2025-07-25', notes: '',
    };
    const result = registerProductionInbound(state, cmd, testWarehouses);
    expect(result.inventoryRecords).toHaveLength(2);
    const newRecord = result.inventoryRecords.find(r => r.warehouseId === 'w2');
    expect(newRecord).toBeDefined();
    expect(newRecord!.actualStock).toBe(200);
    expect(newRecord!.reservedStock).toBe(0);
    expect(newRecord!.sellableStock).toBe(200);
    expect(newRecord!.warehouseName).toBe('广州番禺仓');
  });
});

describe('registerManualInbound', () => {
  it('11. 手工入库不修改生产批次', () => {
    const batch = makeBatch({ quantity: 500, inboundQuantity: 0, status: '待入库' });
    const state = makeState({
      productionBatches: [batch],
      inventoryRecords: [makeInventoryRecord({ actualStock: 100, reservedStock: 20, sellableStock: 80 })],
    });
    const cmd: ManualInboundCommand = {
      type: '手工入库',
      styleNo: 'HD-2025-001',
      productName: '经典直筒牛仔裤',
      color: '深蓝',
      size: 'M',
      warehouseId: 'w1',
      quantity: 50,
      date: '2025-07-25',
      reason: '期初库存',
      notes: '盘点调整',
    };
    const result = registerManualInbound(state, cmd, testWarehouses);
    // 手工入库不返回 updatedBatch
    expect(result.updatedBatch).toBeUndefined();
    // 原始批次不被修改（函数不会修改传入的 state）
    expect(batch.inboundQuantity).toBe(0);
    expect(batch.status).toBe('待入库');
  });

  it('12. 库存流水的变动前后数量正确', () => {
    const state = makeState({
      inventoryRecords: [makeInventoryRecord({ actualStock: 100, reservedStock: 20, sellableStock: 80 })],
    });
    const cmd: ManualInboundCommand = {
      type: '手工入库',
      styleNo: 'HD-2025-001',
      productName: '经典直筒牛仔裤',
      color: '深蓝',
      size: 'M',
      warehouseId: 'w1',
      quantity: 50,
      date: '2025-07-25',
      reason: '盘点调整',
      notes: '',
    };
    const result = registerManualInbound(state, cmd, testWarehouses);
    expect(result.newFlow).toBeDefined();
    expect(result.newFlow.beforeStock).toBe(100);
    expect(result.newFlow.afterStock).toBe(150);
    expect(result.newFlow.quantity).toBe(50);
    expect(result.newFlow.type).toBe('手工调整');
    // 库存也更新了
    expect(result.inventoryRecords[0].actualStock).toBe(150);
    expect(result.inventoryRecords[0].sellableStock).toBe(130);
    expect(result.inventoryRecords[0].reservedStock).toBe(20);
  });
});
