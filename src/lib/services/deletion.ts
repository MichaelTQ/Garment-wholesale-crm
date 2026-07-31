import { deriveBusinessState } from '@/lib/services/business';
import {
  calculateSellableStock,
  calcInventoryStatus,
} from '@/lib/services/inventory';
import type { InventoryFlow, ProductionBatch } from '@/lib/mock-data';
import type { BusinessState } from '@/lib/types/business';

function selectedIdSet(ids: string[]): Set<string> {
  const selected = new Set(ids.filter(Boolean));
  if (selected.size === 0) throw new Error('请先选择要删除的记录');
  return selected;
}

function assertAllSelectedExist(
  selected: Set<string>,
  existingIds: string[],
): void {
  const existing = new Set(existingIds);
  if ([...selected].some((id) => !existing.has(id))) {
    throw new Error('部分记录已被其他设备删除，请刷新列表后重试');
  }
}

function joinNames(names: string[]): string {
  return names.slice(0, 3).join('、') + (names.length > 3 ? `等 ${names.length} 条` : '');
}

export function deleteCustomersTransaction(
  state: BusinessState,
  ids: string[],
): BusinessState {
  const selected = selectedIdSet(ids);
  assertAllSelectedExist(selected, state.customers.map((item) => item.id));
  const customers = state.customers.filter((item) => selected.has(item.id));
  const blocked = customers.filter((customer) =>
    state.orders.some((item) => item.customerId === customer.id) ||
    state.shipments.some((item) => item.customerId === customer.id) ||
    state.payments.some((item) => item.customerId === customer.id) ||
    state.depositApplications.some((item) => item.customerId === customer.id) ||
    (state.customerLedgers[customer.id]?.length ?? 0) > 0,
  );
  if (blocked.length > 0) {
    throw new Error(
      `客户 ${joinNames(blocked.map((item) => item.name))} 已有关联订单、发货、收款或往来账，不能物理删除`,
    );
  }

  const customerLedgers = { ...state.customerLedgers };
  for (const id of selected) delete customerLedgers[id];
  return deriveBusinessState({
    ...state,
    customers: state.customers.filter((item) => !selected.has(item.id)),
    customerLedgers,
  });
}

export function deleteProductsTransaction(
  state: BusinessState,
  ids: string[],
): BusinessState {
  const selected = selectedIdSet(ids);
  assertAllSelectedExist(selected, state.products.map((item) => item.id));
  const products = state.products.filter((item) => selected.has(item.id));
  const blocked = products.filter((product) =>
    state.productionBatches.some(
      (item) => item.productId === product.id || item.styleNo === product.styleNo,
    ) ||
    state.orders.some((order) =>
      order.items.some(
        (item) => item.productId === product.id || item.styleNo === product.styleNo,
      ),
    ) ||
    state.inventoryRecords.some((item) => item.styleNo === product.styleNo) ||
    state.inventoryFlows.some((item) => item.styleNo === product.styleNo),
  );
  if (blocked.length > 0) {
    throw new Error(
      `商品 ${joinNames(blocked.map((item) => item.styleNo))} 已有生产、订单或库存记录，不能物理删除`,
    );
  }

  return deriveBusinessState({
    ...state,
    products: state.products.filter((item) => !selected.has(item.id)),
  });
}

export function deleteFactoriesTransaction(
  state: BusinessState,
  ids: string[],
): BusinessState {
  const selected = selectedIdSet(ids);
  assertAllSelectedExist(selected, state.factories.map((item) => item.id));
  const factories = state.factories.filter((item) => selected.has(item.id));
  const blocked = factories.filter((factory) =>
    state.productionBatches.some((item) => item.factoryId === factory.id) ||
    state.factoryPayments.some((item) => item.factoryId === factory.id),
  );
  if (blocked.length > 0) {
    throw new Error(
      `工厂 ${joinNames(blocked.map((item) => item.name))} 已有生产批次或付款记录，不能物理删除`,
    );
  }

  return deriveBusinessState({
    ...state,
    factories: state.factories.filter((item) => !selected.has(item.id)),
  });
}

export function deleteOrdersTransaction(
  state: BusinessState,
  ids: string[],
): BusinessState {
  const selected = selectedIdSet(ids);
  assertAllSelectedExist(selected, state.orders.map((item) => item.id));
  const orders = state.orders.filter((item) => selected.has(item.id));
  const blocked = orders.filter((order) =>
    !['草稿', '已取消'].includes(order.status) ||
    state.shipments.some((item) => item.orderId === order.id) ||
    state.payments.some((item) => item.relatedOrderId === order.id) ||
    state.paymentAllocations.some((item) => item.orderId === order.id) ||
    state.depositApplications.some((item) => item.orderId === order.id),
  );
  if (blocked.length > 0) {
    throw new Error(
      `订单 ${joinNames(blocked.map((item) => item.orderNo))} 不是草稿/已取消状态，或已有发货收款，不能删除`,
    );
  }

  const deletedOrderNos = new Set(orders.map((item) => item.orderNo));
  const customerLedgers = Object.fromEntries(
    Object.entries(state.customerLedgers).map(([customerId, entries]) => [
      customerId,
      entries.filter((entry) => !deletedOrderNos.has(entry.docNo)),
    ]),
  );
  return deriveBusinessState({
    ...state,
    orders: state.orders.filter((item) => !selected.has(item.id)),
    inventoryReservations: state.inventoryReservations.filter(
      (item) => !selected.has(item.orderId),
    ),
    inventoryFlows: state.inventoryFlows.filter(
      (item) => !deletedOrderNos.has(item.relatedDoc),
    ),
    customerLedgers,
  });
}

function inventoryFlowKey(flow: InventoryFlow): string {
  return [flow.styleNo, flow.color, flow.size, flow.warehouse].join('|');
}

/**
 * 撤销入库流水，而不是只删除审计记录。
 *
 * 只有能从当前库存数量向后连续回退的入库流水才可删除；如果该 SKU 后续
 * 已经出库、调拨或发生其他库存变更，afterStock 将无法衔接，整批操作会拒绝。
 */
export function deleteInboundFlowsTransaction(
  state: BusinessState,
  ids: string[],
): BusinessState {
  const selected = selectedIdSet(ids);
  const flows = state.inventoryFlows.filter((item) => selected.has(item.id));
  if (flows.length !== selected.size) {
    throw new Error('部分入库记录已不存在，请刷新页面后重试');
  }

  const unsupported = flows.filter(
    (flow) =>
      flow.quantity <= 0 ||
      !['生产入库', '手工调整'].includes(flow.type),
  );
  if (unsupported.length > 0) {
    throw new Error('只能删除生产入库或正数手工入库记录');
  }

  const nextRecords = state.inventoryRecords.map((item) => ({ ...item }));
  const flowsByKey = new Map<string, InventoryFlow[]>();
  for (const flow of flows) {
    const key = inventoryFlowKey(flow);
    flowsByKey.set(key, [...(flowsByKey.get(key) ?? []), flow]);
  }

  for (const [key, selectedFlows] of flowsByKey) {
    const [styleNo, color, size, warehouseName] = key.split('|');
    const record = nextRecords.find(
      (item) =>
        item.styleNo === styleNo &&
        item.color === color &&
        item.size === size &&
        item.warehouseName === warehouseName,
    );
    if (!record) {
      throw new Error(`找不到 ${styleNo}/${color}/${size} 的当前库存，不能撤销入库`);
    }

    let currentStock = record.actualStock;
    const remaining = [...selectedFlows];
    while (remaining.length > 0) {
      const tailIndex = remaining.findIndex(
        (flow) => flow.afterStock === currentStock,
      );
      if (tailIndex < 0) {
        throw new Error(
          `${styleNo}/${color}/${size} 入库后已有出库、调拨或其他库存变更，不能直接删除`,
        );
      }
      const [tail] = remaining.splice(tailIndex, 1);
      currentStock -= tail.quantity;
    }

    if (currentStock < record.reservedStock) {
      throw new Error(
        `${styleNo}/${color}/${size} 撤销后库存不足以覆盖已预留数量，不能删除`,
      );
    }
    record.actualStock = currentStock;
    record.sellableStock = calculateSellableStock(
      currentStock,
      record.reservedStock,
    );
    record.status = calcInventoryStatus(record.sellableStock);
  }

  const productionInboundByBatchNo = new Map<string, number>();
  for (const flow of flows) {
    if (flow.type !== '生产入库' || !flow.relatedDoc) continue;
    productionInboundByBatchNo.set(
      flow.relatedDoc,
      (productionInboundByBatchNo.get(flow.relatedDoc) ?? 0) + flow.quantity,
    );
  }

  const productionBatches = state.productionBatches.map((batch) => {
    const deletedQuantity =
      productionInboundByBatchNo.get(batch.batchNo) ??
      productionInboundByBatchNo.get(batch.id.toUpperCase()) ??
      0;
    if (deletedQuantity === 0) return batch;
    const inboundQuantity = Math.max(0, batch.inboundQuantity - deletedQuantity);
    const status: ProductionBatch['status'] =
      inboundQuantity === 0
        ? batch.startDate
          ? '生产中'
          : '待生产'
        : inboundQuantity < batch.quantity
          ? '部分入库'
          : batch.unpaidAmount <= 0
            ? '已结清'
            : '已入库';
    return {
      ...batch,
      inboundQuantity,
      inboundDate: inboundQuantity === 0 ? '' : batch.inboundDate,
      status,
    };
  });

  return deriveBusinessState({
    ...state,
    inventoryRecords: nextRecords.filter(
      (item) => item.actualStock > 0 || item.reservedStock > 0,
    ),
    inventoryFlows: state.inventoryFlows.filter(
      (item) => !selected.has(item.id),
    ),
    productionBatches,
  });
}
