import type { Warehouse } from '@/lib/mock-data';
import {
  BUSINESS_STORAGE_VERSION,
  type BusinessState,
} from '@/lib/types/business';

/**
 * 创建不含任何业务记录的状态。
 *
 * 仓库属于系统基础配置，清空业务数据时必须原样保留，不能退回内置仓库列表。
 */
export function createEmptyBusinessState(
  warehouses: Warehouse[],
): BusinessState {
  return {
    storageVersion: BUSINESS_STORAGE_VERSION,
    customers: [],
    products: [],
    warehouses: warehouses.map((warehouse) => ({ ...warehouse })),
    factories: [],
    productionBatches: [],
    factoryPayments: [],
    inventoryRecords: [],
    inventoryFlows: [],
    inventoryReservations: [],
    orders: [],
    shipments: [],
    payments: [],
    paymentAllocations: [],
    depositApplications: [],
    customerLedgers: {},
  };
}
