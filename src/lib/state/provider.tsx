'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  customerLedgers as initialCustomerLedgers,
  customers as initialCustomers,
  factories as initialFactories,
  factoryPayments as initialFactoryPayments,
  inventoryFlows as initialInventoryFlows,
  inventoryRecords as initialInventoryRecords,
  orders as initialOrders,
  payments as initialPayments,
  productionBatches as initialProductionBatches,
  products as initialProducts,
  shipments as initialShipments,
  warehouses as initialWarehouses,
} from '@/lib/mock-data';
import type { Product } from '@/lib/mock-data';
import {
  addCustomerTransaction,
  addFactoryTransaction,
  addProductTransaction,
  applyDepositTransaction,
  cancelOrderTransaction,
  confirmOrderTransaction,
  createFactoryPaymentTransaction,
  createOrderTransaction,
  createPaymentTransaction,
  createProductionBatchTransaction,
  createShipmentTransaction,
  deriveBusinessState,
  transferStockTransaction,
} from '@/lib/services/business';
import {
  registerManualInbound,
  registerProductionInbound,
} from '@/lib/services/inventory';
import type {
  ApplyDepositCommand,
  CreateOrderCommand,
  CreateFactoryPaymentCommand,
  CreatePaymentCommand,
  CreateProductionBatchCommand,
  CreateShipmentCommand,
  CustomerInput,
  FactoryInput,
  BusinessOperationResult,
  BusinessState,
  TransferStockCommand,
} from '@/lib/types/business';
import {
  BUSINESS_STORAGE_KEY,
  BUSINESS_STORAGE_VERSION,
} from '@/lib/types/business';
import type {
  ManualInboundCommand,
  NewProductInboundCommand,
  ProductionInboundCommand,
} from '@/lib/types/inventory';

type BusinessAction =
  | { type: 'REPLACE_STATE'; state: BusinessState }
  | { type: 'RESET_STATE' };

function createInitialState(): BusinessState {
  return deriveBusinessState({
    storageVersion: BUSINESS_STORAGE_VERSION,
    customers: initialCustomers.map((item) => ({
      ...item,
      categories: [...item.categories],
      frequentCategories: [...item.frequentCategories],
      commonSizes: [...item.commonSizes],
    })),
    products: initialProducts.map((item) => ({
      ...item,
      colors: item.colors.map((color) => ({ ...color })),
      sizes: [...item.sizes],
      images: [...item.images],
    })),
    warehouses: initialWarehouses.map((item) => ({ ...item })),
    factories: initialFactories.map((item) => ({ ...item })),
    productionBatches: initialProductionBatches.map((item) => ({
      ...item,
      inboundQuantity:
        item.inboundQuantity ??
        (item.status === '已入库' || item.status === '已结清' ? item.quantity : 0),
    })),
    factoryPayments: initialFactoryPayments.map((item) => ({ ...item })),
    inventoryRecords: initialInventoryRecords.map((item) => ({ ...item })),
    inventoryFlows: initialInventoryFlows.map((item) => ({ ...item })),
    inventoryReservations: [],
    orders: initialOrders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({ ...item })),
    })),
    shipments: initialShipments.map((shipment) => ({
      ...shipment,
      items: shipment.items.map((item) => ({ ...item })),
    })),
    payments: initialPayments.map((item) => ({ ...item })),
    paymentAllocations: [],
    depositApplications: [],
    customerLedgers: Object.fromEntries(
      Object.entries(initialCustomerLedgers).map(([customerId, entries]) => [
        customerId,
        entries.map((entry) => ({ ...entry })),
      ]),
    ),
  });
}

function businessReducer(state: BusinessState, action: BusinessAction): BusinessState {
  if (action.type === 'REPLACE_STATE') return action.state;
  if (action.type === 'RESET_STATE') return createInitialState();
  return state;
}

function normalizeStoredState(value: unknown): BusinessState | null {
  if (!value || typeof value !== 'object') return null;
  const stored = value as Partial<BusinessState>;
  if (stored.storageVersion !== BUSINESS_STORAGE_VERSION) return null;
  const requiredArrays: Array<keyof BusinessState> = [
    'customers',
    'products',
    'warehouses',
    'inventoryRecords',
    'inventoryFlows',
    'orders',
    'shipments',
    'payments',
  ];
  if (!requiredArrays.every((key) => Array.isArray(stored[key]))) return null;
  const initial = createInitialState();
  return deriveBusinessState({
    ...initial,
    ...stored,
    warehouses:
      Array.isArray(stored.warehouses) && stored.warehouses.length > 0
        ? stored.warehouses
        : initial.warehouses,
    inventoryReservations: Array.isArray(stored.inventoryReservations)
      ? stored.inventoryReservations
      : [],
    paymentAllocations: Array.isArray(stored.paymentAllocations)
      ? stored.paymentAllocations
      : [],
    depositApplications: Array.isArray(stored.depositApplications)
      ? stored.depositApplications
      : [],
    customerLedgers:
      stored.customerLedgers && typeof stored.customerLedgers === 'object'
        ? stored.customerLedgers
        : {},
  });
}

interface BusinessContextValue extends BusinessState {
  hydrated: boolean;
  productionInbound: (command: ProductionInboundCommand) => BusinessOperationResult;
  manualInbound: (command: ManualInboundCommand) => BusinessOperationResult;
  newProductInbound: (command: NewProductInboundCommand) => BusinessOperationResult;
  addProduct: (product: Product) => BusinessOperationResult;
  addCustomer: (input: CustomerInput) => BusinessOperationResult;
  addFactory: (input: FactoryInput) => BusinessOperationResult;
  createProductionBatch: (command: CreateProductionBatchCommand) => BusinessOperationResult;
  createFactoryPayment: (command: CreateFactoryPaymentCommand) => BusinessOperationResult;
  createOrder: (command: CreateOrderCommand) => BusinessOperationResult;
  confirmOrder: (orderId: string) => BusinessOperationResult;
  cancelOrder: (orderId: string) => BusinessOperationResult;
  createShipment: (command: CreateShipmentCommand) => BusinessOperationResult;
  createPayment: (command: CreatePaymentCommand) => BusinessOperationResult;
  applyDeposit: (command: ApplyDepositCommand) => BusinessOperationResult;
  transferStock: (command: TransferStockCommand) => BusinessOperationResult;
  resetBusinessData: () => void;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(businessReducer, undefined, createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);

  const replaceState = useCallback((nextState: BusinessState) => {
    const derived = deriveBusinessState(nextState);
    stateRef.current = derived;
    dispatch({ type: 'REPLACE_STATE', state: derived });
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BUSINESS_STORAGE_KEY);
      if (raw) {
        const normalized = normalizeStoredState(JSON.parse(raw) as unknown);
        if (normalized) replaceState(normalized);
      }
    } catch {
      window.localStorage.removeItem(BUSINESS_STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, [replaceState]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const runTransaction = useCallback(
    (
      transaction: (current: BusinessState) => BusinessState,
      id?: string,
    ): BusinessOperationResult => {
      try {
        const next = transaction(stateRef.current);
        replaceState(next);
        return { ok: true, id };
      } catch (error: unknown) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : '业务操作失败',
        };
      }
    },
    [replaceState],
  );

  const productionInbound = useCallback(
    (command: ProductionInboundCommand): BusinessOperationResult =>
      runTransaction((current) => {
        const result = registerProductionInbound(
          current,
          command,
          current.warehouses,
        );
        return {
          ...current,
          inventoryRecords: result.inventoryRecords,
          inventoryFlows: [result.newFlow, ...current.inventoryFlows],
          productionBatches: current.productionBatches.map((batch) =>
            batch.id === result.updatedBatch?.id ? result.updatedBatch : batch,
          ),
        };
      }),
    [runTransaction],
  );

  const manualInbound = useCallback(
    (command: ManualInboundCommand): BusinessOperationResult =>
      runTransaction((current) => {
        const result = registerManualInbound(current, command, current.warehouses);
        return {
          ...current,
          inventoryRecords: result.inventoryRecords,
          inventoryFlows: [result.newFlow, ...current.inventoryFlows],
        };
      }),
    [runTransaction],
  );

  const addProduct = useCallback(
    (product: Product): BusinessOperationResult =>
      runTransaction((current) => addProductTransaction(current, product), product.id),
    [runTransaction],
  );

  const newProductInbound = useCallback(
    (command: NewProductInboundCommand): BusinessOperationResult =>
      runTransaction((current) => {
        let working = addProductTransaction(current, command.product);
        const newFlows = [];
        for (const entry of command.entries) {
          const result = registerManualInbound(
            working,
            entry,
            working.warehouses,
          );
          newFlows.push(result.newFlow);
          working = { ...working, inventoryRecords: result.inventoryRecords };
        }
        return {
          ...working,
          inventoryFlows: [...newFlows, ...current.inventoryFlows],
        };
      }, command.product.id),
    [runTransaction],
  );

  const addCustomer = useCallback(
    (input: CustomerInput): BusinessOperationResult => {
      const createdAt = new Date().toISOString();
      return runTransaction((current) =>
        addCustomerTransaction(current, input, createdAt),
      );
    },
    [runTransaction],
  );

  const addFactory = useCallback(
    (input: FactoryInput): BusinessOperationResult =>
      runTransaction((current) => addFactoryTransaction(current, input)),
    [runTransaction],
  );

  const createProductionBatch = useCallback(
    (command: CreateProductionBatchCommand): BusinessOperationResult =>
      runTransaction((current) =>
        createProductionBatchTransaction(current, command),
      ),
    [runTransaction],
  );

  const createFactoryPayment = useCallback(
    (command: CreateFactoryPaymentCommand): BusinessOperationResult =>
      runTransaction((current) =>
        createFactoryPaymentTransaction(
          current,
          command,
          new Date().toISOString(),
        ),
      ),
    [runTransaction],
  );

  const createOrder = useCallback(
    (command: CreateOrderCommand): BusinessOperationResult => {
      try {
        const result = createOrderTransaction(
          stateRef.current,
          command,
          new Date().toISOString(),
        );
        replaceState(result.state);
        return { ok: true, id: result.orderId };
      } catch (error: unknown) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : '订单创建失败',
        };
      }
    },
    [replaceState],
  );

  const confirmOrder = useCallback(
    (orderId: string): BusinessOperationResult =>
      runTransaction(
        (current) =>
          confirmOrderTransaction(current, orderId, new Date().toISOString()),
        orderId,
      ),
    [runTransaction],
  );

  const cancelOrder = useCallback(
    (orderId: string): BusinessOperationResult =>
      runTransaction(
        (current) =>
          cancelOrderTransaction(current, orderId, new Date().toISOString()),
        orderId,
      ),
    [runTransaction],
  );

  const createShipment = useCallback(
    (command: CreateShipmentCommand): BusinessOperationResult => {
      try {
        const result = createShipmentTransaction(
          stateRef.current,
          command,
          new Date().toISOString(),
        );
        replaceState(result.state);
        return { ok: true, id: result.shipmentId };
      } catch (error: unknown) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : '发货失败',
        };
      }
    },
    [replaceState],
  );

  const createPayment = useCallback(
    (command: CreatePaymentCommand): BusinessOperationResult => {
      try {
        const result = createPaymentTransaction(
          stateRef.current,
          command,
          new Date().toISOString(),
        );
        replaceState(result.state);
        return { ok: true, id: result.paymentId };
      } catch (error: unknown) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : '收款登记失败',
        };
      }
    },
    [replaceState],
  );

  const applyDeposit = useCallback(
    (command: ApplyDepositCommand): BusinessOperationResult => {
      try {
        const result = applyDepositTransaction(
          stateRef.current,
          command,
          new Date().toISOString(),
        );
        replaceState(result.state);
        return { ok: true, id: result.applicationId };
      } catch (error: unknown) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : '预存款抵扣失败',
        };
      }
    },
    [replaceState],
  );

  const transferStock = useCallback(
    (command: TransferStockCommand): BusinessOperationResult =>
      runTransaction((current) => transferStockTransaction(current, command)),
    [runTransaction],
  );

  const resetBusinessData = useCallback(() => {
    const emptyState = createInitialState();
    stateRef.current = emptyState;
    window.localStorage.removeItem(BUSINESS_STORAGE_KEY);
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const value = useMemo<BusinessContextValue>(
    () => ({
      ...state,
      hydrated,
      productionInbound,
      manualInbound,
      newProductInbound,
      addProduct,
      addCustomer,
      addFactory,
      createProductionBatch,
      createFactoryPayment,
      createOrder,
      confirmOrder,
      cancelOrder,
      createShipment,
      createPayment,
      applyDeposit,
      transferStock,
      resetBusinessData,
    }),
    [
      state,
      hydrated,
      productionInbound,
      manualInbound,
      newProductInbound,
      addProduct,
      addCustomer,
      addFactory,
      createProductionBatch,
      createFactoryPayment,
      createOrder,
      confirmOrder,
      cancelOrder,
      createShipment,
      createPayment,
      applyDeposit,
      transferStock,
      resetBusinessData,
    ],
  );

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessState(): BusinessContextValue {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusinessState must be used within a BusinessProvider');
  }
  return context;
}
