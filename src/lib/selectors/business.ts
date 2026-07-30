import type { Customer, Order, Shipment } from '@/lib/mock-data';
import type { BusinessState } from '@/lib/types/business';

export interface MonthlySalesPoint {
  month: string;
  sales: number;
  cost: number;
  profit: number;
}

export function selectMonthlySalesData(
  state: Pick<BusinessState, 'shipments' | 'productionBatches'>,
): MonthlySalesPoint[] {
  const grouped = new Map<string, { sales: number; cost: number }>();
  for (const shipment of state.shipments) {
    const month = shipment.shipDate.slice(0, 7);
    if (!month) continue;
    const current = grouped.get(month) ?? { sales: 0, cost: 0 };
    current.sales += shipment.totalAmount;
    current.cost += shipment.items.reduce((sum, item) => {
      const latestBatch = state.productionBatches
        .filter((batch) => batch.styleNo === item.styleNo)
        .sort((left, right) => right.inboundDate.localeCompare(left.inboundDate))[0];
      return sum + (latestBatch?.unitCost ?? 0) * item.thisShipQty;
    }, 0);
    grouped.set(month, current);
  }
  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, values]) => ({
      month,
      sales: values.sales,
      cost: values.cost,
      profit: values.sales - values.cost,
    }));
}

export function selectTopDebtCustomers(
  customers: Customer[],
  limit = 5,
): Customer[] {
  return [...customers]
    .filter((customer) => customer.shippedDebt > 0)
    .sort((left, right) => right.shippedDebt - left.shippedDebt)
    .slice(0, limit);
}

export function selectOrderShippedValue(order: Order): number {
  return order.items.reduce(
    (sum, item) => sum + item.shippedQuantity * item.unitPrice,
    0,
  );
}

export function selectCustomerShipments(
  shipments: Shipment[],
  customerId: string,
): Shipment[] {
  return shipments.filter((shipment) => shipment.customerId === customerId);
}
