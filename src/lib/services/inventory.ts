// 入库业务纯函数 —— 所有计算逻辑集中在此，不涉及 React 或 JSX

import type { InventoryRecord, InventoryFlow, ProductionBatch, Warehouse } from '@/lib/mock-data';
import type {
  ProductionInboundCommand,
  ManualInboundCommand,
  InboundResult,
  SkuKey,
} from '@/lib/types/inventory';

// ============================================================
// 工具函数
// ============================================================

/** 计算：可销售库存 = 实际库存 - 已预留库存 */
export function calculateSellableStock(actualStock: number, reservedStock: number): number {
  return Math.max(0, actualStock - reservedStock);
}

/** 获取生产批次的剩余可入库数量 */
export function getRemainingInboundQuantity(batch: ProductionBatch): number {
  return Math.max(0, batch.quantity - (batch.inboundQuantity ?? 0));
}

/** 生成唯一 ID（纯函数版本，接受时间戳参数以保证可测试性） */
export function generateId(prefix: string, now?: number): string {
  const ts = now ?? Date.now();
  return `${prefix}${ts.toString(36)}`;
}

/** 生成入库流水编号 */
export function generateFlowNo(now?: number): string {
  const ts = now ?? Date.now();
  return `IF-${ts.toString(36).toUpperCase()}`;
}

/** 生成 SKU 匹配键 */
export function getInventoryKey(warehouseId: string, styleNo: string, color: string, size: string): string {
  return `${warehouseId}|${styleNo}|${color}|${size}`;
}

/** 根据 SKU 键查找库存记录索引 */
export function findInventoryIndex(records: InventoryRecord[], key: SkuKey): number {
  return records.findIndex(
    (r) =>
      r.styleNo === key.styleNo &&
      r.color === key.color &&
      r.size === key.size &&
      r.warehouseId === key.warehouseId,
  );
}

/** 计算库存状态 */
export function calcInventoryStatus(actualStock: number): InventoryRecord['status'] {
  if (actualStock <= 0) return '缺货';
  if (actualStock <= 10) return '低库存';
  if (actualStock <= 50) return '偏低';
  if (actualStock <= 200) return '正常';
  return '充足';
}

/** 判断生产批次是否可以入库 */
export function canBatchInbound(batch: ProductionBatch): boolean {
  if (!batch) return false;
  const status = batch.status;
  // 已完全入库、已结清、已取消的批次不能再入库
  if (status === '已入库' || status === '已结清' || status === '已取消') return false;
  // 剩余为 0 也不能入库
  if (getRemainingInboundQuantity(batch) <= 0) return false;
  return true;
}

/** 计算生产批次入库后的新状态 */
export function calcBatchStatusAfterInbound(
  batch: ProductionBatch,
  totalInboundQuantity: number,
): ProductionBatch['status'] {
  if (totalInboundQuantity <= 0) return batch.status;
  if (totalInboundQuantity >= batch.quantity) {
    return batch.unpaidAmount <= 0 ? '已结清' : '已入库';
  }
  return '部分入库';
}

// ============================================================
// 验证函数
// ============================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** 验证生产入库命令 */
export function validateProductionInbound(
  command: ProductionInboundCommand,
  batch: ProductionBatch | undefined,
  warehouses: Warehouse[],
): ValidationResult {
  const errors: string[] = [];

  if (!batch) {
    errors.push('请选择有效的生产批次');
    return { valid: false, errors };
  }

  if (!canBatchInbound(batch)) {
    errors.push(`该批次状态为"${batch.status}"，不能再入库`);
  }

  if (!command.warehouseId) {
    errors.push('请选择入库仓库');
  } else {
    const wh = warehouses.find((w) => w.id === command.warehouseId);
    if (!wh) {
      errors.push('所选仓库不存在');
    }
  }

  if (!command.quantity || command.quantity <= 0) {
    errors.push('入库数量必须大于 0');
  } else if (!Number.isInteger(command.quantity)) {
    errors.push('入库数量必须为整数');
  }

  if (batch && command.quantity > 0) {
    const remaining = getRemainingInboundQuantity(batch);
    if (command.quantity > remaining) {
      errors.push(`本次入库数量不能超过剩余可入库数量 ${remaining} 件`);
    }
  }

  if (!command.date) {
    errors.push('请选择入库日期');
  }

  return { valid: errors.length === 0, errors };
}

/** 验证手工入库命令 */
export function validateManualInbound(
  command: ManualInboundCommand,
  warehouses: Warehouse[],
): ValidationResult {
  const errors: string[] = [];

  if (!command.styleNo) {
    errors.push('请选择商品款号');
  }
  if (!command.color) {
    errors.push('请选择颜色');
  }
  if (!command.size) {
    errors.push('请选择尺码');
  }
  if (!command.warehouseId) {
    errors.push('请选择入库仓库');
  } else {
    const wh = warehouses.find((w) => w.id === command.warehouseId);
    if (!wh) {
      errors.push('所选仓库不存在');
    }
  }
  if (!command.quantity || command.quantity <= 0) {
    errors.push('入库数量必须大于 0');
  } else if (!Number.isInteger(command.quantity)) {
    errors.push('入库数量必须为整数');
  }
  if (!command.date) {
    errors.push('请选择入库日期');
  }
  if (!command.reason || command.reason.trim() === '') {
    errors.push('手工入库必须填写入库原因');
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// 核心业务函数：生产入库
// ============================================================

export function registerProductionInbound(
  state: { inventoryRecords: InventoryRecord[]; inventoryFlows: InventoryFlow[]; productionBatches: ProductionBatch[] },
  command: ProductionInboundCommand,
  warehouses: Warehouse[] = [],
): InboundResult {
  const batch = state.productionBatches.find((b) => b.id === command.batchId);
  if (!batch) throw new Error('生产批次不存在');
  if (!canBatchInbound(batch)) throw new Error('该生产批次已完成或已取消，无法继续入库');
  const remaining = getRemainingInboundQuantity(batch);
  if (command.quantity > remaining) throw new Error(`本次入库数量不能超过剩余可入库数量 ${remaining} 件`);

  // 深拷贝库存记录
  const newRecords = state.inventoryRecords.map((r) => ({ ...r }));
  const wh = warehouses.find((w) => w.id === command.warehouseId);
  const whName = wh?.name || '';

  const skuKey: SkuKey = {
    styleNo: batch.styleNo,
    color: batch.color,
    size: batch.size,
    warehouseId: command.warehouseId,
  };

  const existIdx = findInventoryIndex(newRecords, skuKey);
  let beforeStock = 0;
  let afterStock = 0;

  if (existIdx >= 0) {
    // 更新已有库存记录
    beforeStock = newRecords[existIdx].actualStock;
    afterStock = beforeStock + command.quantity;
    newRecords[existIdx].actualStock = afterStock;
    newRecords[existIdx].sellableStock = calculateSellableStock(afterStock, newRecords[existIdx].reservedStock);
    newRecords[existIdx].status = calcInventoryStatus(afterStock);
  } else {
    // 创建新库存记录
    beforeStock = 0;
    afterStock = command.quantity;
    newRecords.push({
      id: generateId('inv'),
      styleNo: batch.styleNo,
      productName: batch.productName,
      color: batch.color,
      size: batch.size,
      warehouseId: command.warehouseId,
      warehouseName: whName,
      actualStock: afterStock,
      reservedStock: 0,
      sellableStock: afterStock,
      status: calcInventoryStatus(afterStock),
    });
  }

  // 更新生产批次
  const currentInboundQty = batch.inboundQuantity ?? 0;
  const totalInboundQty = currentInboundQty + command.quantity;
  const newBatchStatus = calcBatchStatusAfterInbound(batch, totalInboundQty);

  const updatedBatch: ProductionBatch = {
    ...batch,
    inboundQuantity: totalInboundQty,
    inboundDate: command.date,
    warehouseId: command.warehouseId,
    status: newBatchStatus,
  };

  // 生成库存流水
  const newFlow: InventoryFlow = {
    id: generateId('if'),
    date: command.date,
    type: '生产入库',
    product: batch.productName,
    styleNo: batch.styleNo,
    color: batch.color,
    size: batch.size,
    warehouse: existIdx >= 0 ? newRecords[existIdx].warehouseName : whName,
    quantity: command.quantity,
    beforeStock,
    afterStock,
    relatedDoc: batch.batchNo || batch.id.toUpperCase(),
    notes: command.notes || `生产入库 ${command.quantity} 件`,
  };

  return {
    inventoryRecords: newRecords,
    newFlow,
    updatedBatch,
  };
}

// ============================================================
// 核心业务函数：手工入库
// ============================================================

export function registerManualInbound(
  state: { inventoryRecords: InventoryRecord[]; inventoryFlows: InventoryFlow[]; productionBatches: ProductionBatch[] },
  command: ManualInboundCommand,
  warehouses: Warehouse[] = [],
): InboundResult {
  // 深拷贝库存记录
  const newRecords = state.inventoryRecords.map((r) => ({ ...r }));
  const wh = warehouses.find((w) => w.id === command.warehouseId);
  const warehouseName = wh?.name || command.warehouseId;

  const skuKey: SkuKey = {
    styleNo: command.styleNo,
    color: command.color,
    size: command.size,
    warehouseId: command.warehouseId,
  };

  const existIdx = findInventoryIndex(newRecords, skuKey);
  let beforeStock = 0;
  let afterStock = 0;

  if (existIdx >= 0) {
    beforeStock = newRecords[existIdx].actualStock;
    afterStock = beforeStock + command.quantity;
    newRecords[existIdx].actualStock = afterStock;
    newRecords[existIdx].sellableStock = calculateSellableStock(afterStock, newRecords[existIdx].reservedStock);
    newRecords[existIdx].status = calcInventoryStatus(afterStock);
  } else {
    beforeStock = 0;
    afterStock = command.quantity;
    newRecords.push({
      id: generateId('inv'),
      styleNo: command.styleNo,
      productName: command.productName,
      color: command.color,
      size: command.size,
      warehouseId: command.warehouseId,
      warehouseName,
      actualStock: afterStock,
      reservedStock: 0,
      sellableStock: afterStock,
      status: calcInventoryStatus(afterStock),
    });
  }

  // 生成库存流水
  const flowType: InventoryFlow['type'] = command.reason === '期初库存' ? '手工调整' : '手工调整';
  const newFlow: InventoryFlow = {
    id: generateId('if'),
    date: command.date,
    type: flowType,
    product: command.productName,
    styleNo: command.styleNo,
    color: command.color,
    size: command.size,
    warehouse: warehouseName,
    quantity: command.quantity,
    beforeStock,
    afterStock,
    relatedDoc: '',
    notes: `${command.reason}${command.notes ? '；' + command.notes : ''}`,
  };

  return {
    inventoryRecords: newRecords,
    newFlow,
    // 手工入库不修改生产批次
  };
}
