// 入库功能相关类型定义

import type { InventoryRecord, InventoryFlow, ProductionBatch } from '@/lib/mock-data';

/** 入库类型 */
export type InboundType = '生产入库' | '手工入库';

/** 生产入库命令 */
export interface ProductionInboundCommand {
  type: '生产入库';
  batchId: string;
  warehouseId: string;
  quantity: number;
  date: string;
  notes: string;
}

/** 手工入库命令 */
export interface ManualInboundCommand {
  type: '手工入库';
  styleNo: string;
  productName: string;
  color: string;
  size: string;
  warehouseId: string;
  quantity: number;
  date: string;
  reason: string;
  notes: string;
}

/** 入库命令联合类型 */
export type InboundCommand = ProductionInboundCommand | ManualInboundCommand;

/** 入库结果 */
export interface InboundResult {
  /** 更新后的库存记录列表 */
  inventoryRecords: InventoryRecord[];
  /** 新增的库存流水 */
  newFlow: InventoryFlow;
  /** 更新后的生产批次（生产入库时） */
  updatedBatch?: ProductionBatch;
}

/** 业务状态（供 Context 使用） */
export interface BusinessState {
  inventoryRecords: InventoryRecord[];
  inventoryFlows: InventoryFlow[];
  productionBatches: ProductionBatch[];
}

/** 业务 Action */
export type BusinessAction =
  | { type: 'PRODUCTION_INBOUND'; command: ProductionInboundCommand }
  | { type: 'MANUAL_INBOUND'; command: ManualInboundCommand };

/** SKU 匹配键 */
export interface SkuKey {
  styleNo: string;
  color: string;
  size: string;
  warehouseId: string;
}

/** 入库表单数据 */
export interface InboundFormData {
  inboundType: InboundType;
  batchId: string;
  warehouseId: string;
  quantity: number;
  date: string;
  reason: string;
  notes: string;
}
