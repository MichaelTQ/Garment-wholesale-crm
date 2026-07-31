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
import {
  deleteCustomersTransaction,
  deleteFactoriesTransaction,
  deleteInboundFlowsTransaction,
  deleteOrdersTransaction,
  deleteProductsTransaction,
} from '@/lib/services/deletion';
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
import { createEmptyBusinessState } from '@/lib/state/empty-state';
import type {
  ManualInboundCommand,
  NewProductInboundCommand,
  ProductionInboundCommand,
} from '@/lib/types/inventory';

const BUSINESS_SYNC_PENDING_KEY = `${BUSINESS_STORAGE_KEY}:sync-pending`;

export type BusinessSyncStatus =
  | 'loading'
  | 'syncing'
  | 'synced'
  | 'local-only'
  | 'error';

type BusinessAction = { type: 'REPLACE_STATE'; state: BusinessState };

function createInitialState(): BusinessState {
  return deriveBusinessState(createEmptyBusinessState(initialWarehouses));
}

function businessReducer(state: BusinessState, action: BusinessAction): BusinessState {
  if (action.type === 'REPLACE_STATE') return action.state;
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

interface DatabaseLoadResult {
  state: BusinessState | null;
  error: string | null;
  notConfigured: boolean;
}

interface DatabaseSyncResult {
  error: string | null;
  notConfigured: boolean;
}

interface DatabaseApiResponse {
  ok?: boolean;
  code?: string;
  error?: string;
  data?: unknown;
}

async function readDatabaseResponse(
  response: Response,
): Promise<DatabaseApiResponse | null> {
  try {
    return (await response.json()) as DatabaseApiResponse;
  } catch {
    return null;
  }
}

/** 从 Supabase 加载全量业务数据 */
async function loadFromSupabase(): Promise<DatabaseLoadResult> {
  try {
    const res = await fetch('/api/db/load', {
      method: 'POST',
      cache: 'no-store',
    });
    const json = await readDatabaseResponse(res);
    if (!res.ok) {
      return {
        state: null,
        error:
          json?.error ?? `连接云数据库失败（HTTP ${res.status}）`,
        notConfigured: json?.code === 'DATABASE_NOT_CONFIGURED',
      };
    }
    if (!json?.ok || !json.data) {
      return {
        state: null,
        error: json?.error ?? '数据库没有返回有效数据',
        notConfigured: false,
      };
    }
    // Normalize the data from DB
    const normalized = normalizeStoredState(json.data);
    if (!normalized) {
      return {
        state: null,
        error: '数据库数据格式与当前版本不兼容',
        notConfigured: false,
      };
    }
    return { state: normalized, error: null, notConfigured: false };
  } catch (err) {
    return {
      state: null,
      error: `连接云数据库异常：${err instanceof Error ? err.message : String(err)}`,
      notConfigured: false,
    };
  }
}

/** 全量同步到 Supabase（防抖后调用），返回错误信息 */
async function syncToSupabase(
  state: BusinessState,
): Promise<DatabaseSyncResult> {
  try {
    const res = await fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });
    const json = await readDatabaseResponse(res);
    if (!res.ok) {
      return {
        error:
          json?.error ?? `同步到云数据库失败（HTTP ${res.status}）`,
        notConfigured: json?.code === 'DATABASE_NOT_CONFIGURED',
      };
    }
    if (!json?.ok) {
      return {
        error: json?.error ?? '数据库返回未知同步错误',
        notConfigured: json?.code === 'DATABASE_NOT_CONFIGURED',
      };
    }
    return { error: null, notConfigured: false };
  } catch (err) {
    return {
      error: `同步到云数据库异常：${err instanceof Error ? err.message : String(err)}`,
      notConfigured: false,
    };
  }
}

interface BusinessContextValue extends BusinessState {
  hydrated: boolean;
  syncStatus: BusinessSyncStatus;
  syncError: string | null;
  retrySync: () => void;
  productionInbound: (command: ProductionInboundCommand) => BusinessOperationResult;
  manualInbound: (command: ManualInboundCommand) => BusinessOperationResult;
  newProductInbound: (command: NewProductInboundCommand) => BusinessOperationResult;
  addProduct: (product: Product) => BusinessOperationResult;
  addCustomer: (input: CustomerInput) => BusinessOperationResult;
  addFactory: (input: FactoryInput) => BusinessOperationResult;
  deleteCustomers: (ids: string[]) => BusinessOperationResult;
  deleteProducts: (ids: string[]) => BusinessOperationResult;
  deleteFactories: (ids: string[]) => BusinessOperationResult;
  deleteOrders: (ids: string[]) => BusinessOperationResult;
  deleteInboundFlows: (ids: string[]) => BusinessOperationResult;
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
  const [syncStatus, setSyncStatus] = useState<BusinessSyncStatus>('loading');
  const [syncError, setSyncError] = useState<string | null>(null);
  const stateRef = useRef(state);
  const hydratedRef = useRef(false);
  const pendingSyncRef = useRef<BusinessState | null>(null);
  const syncingRef = useRef(false);
  const pullingRef = useRef(false);

  const markLocalSyncPending = useCallback((pending: boolean) => {
    try {
      if (pending) {
        window.localStorage.setItem(BUSINESS_SYNC_PENDING_KEY, '1');
      } else {
        window.localStorage.removeItem(BUSINESS_SYNC_PENDING_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const flushSyncQueue = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      while (pendingSyncRef.current) {
        const snapshot = pendingSyncRef.current;
        pendingSyncRef.current = null;
        setSyncStatus('syncing');
        setSyncError(null);

        const syncResult = await syncToSupabase(snapshot);
        if (syncResult.error) {
          // 保留失败快照供用户重试；期间产生的新状态优先。
          pendingSyncRef.current ??= snapshot;
          setSyncStatus(syncResult.notConfigured ? 'local-only' : 'error');
          setSyncError(syncResult.error);
          console.error(
            '[BusinessProvider] 数据库同步失败:',
            syncResult.error,
          );
          return;
        }
      }

      markLocalSyncPending(false);
      setSyncStatus('synced');
      setSyncError(null);
    } finally {
      syncingRef.current = false;
    }
  }, [markLocalSyncPending]);

  // 本地缓存立即写入；数据库请求串行执行并自动合并连续变更。
  const scheduleSync = useCallback((nextState: BusinessState) => {
    try {
      window.localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // ignore
    }
    markLocalSyncPending(true);
    pendingSyncRef.current = nextState;
    void flushSyncQueue();
  }, [flushSyncQueue, markLocalSyncPending]);

  const replaceState = useCallback((nextState: BusinessState) => {
    const derived = deriveBusinessState(nextState);
    stateRef.current = derived;
    dispatch({ type: 'REPLACE_STATE', state: derived });
    if (hydratedRef.current) {
      scheduleSync(derived);
    }
    return derived;
  }, [scheduleSync]);

  const retrySync = useCallback(() => {
    scheduleSync(stateRef.current);
  }, [scheduleSync]);

  // 应用其他设备写入的数据库快照，不反向触发同步。
  const applyRemoteState = useCallback((remoteState: BusinessState) => {
    const current = stateRef.current;
    const remoteOrderIds = new Set(remoteState.orders.map((item) => item.id));
    const remoteCustomerIds = new Set(
      remoteState.customers.map((item) => item.id),
    );
    const remotePaymentIds = new Set(
      remoteState.payments.map((item) => item.id),
    );
    const merged = deriveBusinessState({
      ...remoteState,
      // 这三类运行时明细尚无独立数据库表；保留本机仍有有效主记录的部分。
      inventoryReservations: current.inventoryReservations.filter((item) =>
        remoteOrderIds.has(item.orderId),
      ),
      paymentAllocations: current.paymentAllocations.filter(
        (item) =>
          remoteOrderIds.has(item.orderId) &&
          remotePaymentIds.has(item.paymentId),
      ),
      depositApplications: current.depositApplications.filter(
        (item) =>
          remoteOrderIds.has(item.orderId) &&
          remoteCustomerIds.has(item.customerId),
      ),
    });
    if (JSON.stringify(merged) === JSON.stringify(current)) return;

    stateRef.current = merged;
    dispatch({ type: 'REPLACE_STATE', state: merged });
    try {
      window.localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // ignore
    }
    setSyncStatus('synced');
    setSyncError(null);
  }, []);

  // 初始化：优先从 Supabase 加载，回退到 localStorage
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      // 1. 先尝试 localStorage（快速显示）
      let localState: BusinessState | null = null;
      let hasPendingLocalSync = false;
      try {
        const raw = window.localStorage.getItem(BUSINESS_STORAGE_KEY);
        hasPendingLocalSync =
          window.localStorage.getItem(BUSINESS_SYNC_PENDING_KEY) === '1';
        if (raw) {
          localState = normalizeStoredState(JSON.parse(raw) as unknown);
        }
      } catch {
        window.localStorage.removeItem(BUSINESS_STORAGE_KEY);
      }

      // 2. 再从 Supabase 加载（权威数据源）
      const loadResult = await loadFromSupabase();
      const dbState = loadResult.state;
      if (cancelled) return;

      // 本地存在尚未上传的变更时，禁止旧数据库快照覆盖本地状态。
      const selectedState =
        localState && hasPendingLocalSync
          ? localState
          : dbState ?? localState ?? stateRef.current;
      const derivedState = replaceState(selectedState);

      if (dbState && !hasPendingLocalSync) {
        try {
          window.localStorage.setItem(
            BUSINESS_STORAGE_KEY,
            JSON.stringify(derivedState),
          );
        } catch {
          // ignore
        }
      }

      hydratedRef.current = true;
      setHydrated(true);
      if (localState && hasPendingLocalSync) {
        scheduleSync(derivedState);
      } else if (dbState) {
        markLocalSyncPending(false);
        setSyncStatus('synced');
      } else if (localState) {
        setSyncStatus(loadResult.notConfigured ? 'local-only' : 'error');
        setSyncError(loadResult.error);
      } else {
        setSyncStatus(loadResult.notConfigured ? 'local-only' : 'error');
        setSyncError(
          loadResult.error ?? '数据库连接失败，当前显示初始数据',
        );
      }
    }

    hydrate();
    return () => { cancelled = true; };
  }, [markLocalSyncPending, replaceState, scheduleSync]);

  // 其他设备写入后，当前可见页面会在 5 秒内自动刷新数据。
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const pullLatest = async () => {
      if (
        cancelled ||
        document.visibilityState !== 'visible' ||
        pullingRef.current ||
        syncingRef.current ||
        pendingSyncRef.current
      ) {
        return;
      }
      pullingRef.current = true;
      try {
        const remoteResult = await loadFromSupabase();
        if (!cancelled && remoteResult.state) {
          applyRemoteState(remoteResult.state);
        }
      } finally {
        pullingRef.current = false;
      }
    };

    const handleFocus = () => {
      void pullLatest();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void pullLatest();
    };
    const intervalId = window.setInterval(() => {
      void pullLatest();
    }, 5_000);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [applyRemoteState, hydrated]);

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

  const deleteCustomers = useCallback(
    (ids: string[]): BusinessOperationResult =>
      runTransaction((current) => deleteCustomersTransaction(current, ids)),
    [runTransaction],
  );

  const deleteProducts = useCallback(
    (ids: string[]): BusinessOperationResult =>
      runTransaction((current) => deleteProductsTransaction(current, ids)),
    [runTransaction],
  );

  const deleteFactories = useCallback(
    (ids: string[]): BusinessOperationResult =>
      runTransaction((current) => deleteFactoriesTransaction(current, ids)),
    [runTransaction],
  );

  const deleteOrders = useCallback(
    (ids: string[]): BusinessOperationResult =>
      runTransaction((current) => deleteOrdersTransaction(current, ids)),
    [runTransaction],
  );

  const deleteInboundFlows = useCallback(
    (ids: string[]): BusinessOperationResult =>
      runTransaction((current) => deleteInboundFlowsTransaction(current, ids)),
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
    replaceState(createEmptyBusinessState(stateRef.current.warehouses));
  }, [replaceState]);

  const value = useMemo<BusinessContextValue>(
    () => ({
      ...state,
      hydrated,
      syncStatus,
      syncError,
      retrySync,
      productionInbound,
      manualInbound,
      newProductInbound,
      addProduct,
      addCustomer,
      addFactory,
      deleteCustomers,
      deleteProducts,
      deleteFactories,
      deleteOrders,
      deleteInboundFlows,
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
      syncStatus,
      syncError,
      retrySync,
      productionInbound,
      manualInbound,
      newProductInbound,
      addProduct,
      addCustomer,
      addFactory,
      deleteCustomers,
      deleteProducts,
      deleteFactories,
      deleteOrders,
      deleteInboundFlows,
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
