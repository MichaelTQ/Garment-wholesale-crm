'use client';

import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import {
  inventoryRecords as initialInventoryRecords,
  inventoryFlows as initialInventoryFlows,
  productionBatches as initialProductionBatches,
  warehouses,
} from '@/lib/mock-data';
import type { InventoryRecord, InventoryFlow, ProductionBatch } from '@/lib/mock-data';
import type {
  BusinessState,
  BusinessAction,
  ProductionInboundCommand,
  ManualInboundCommand,
} from '@/lib/types/inventory';
import {
  registerProductionInbound,
  registerManualInbound,
} from '@/lib/services/inventory';

// ============================================================
// Initial State
// ============================================================

const initialState: BusinessState = {
  inventoryRecords: initialInventoryRecords.map((r) => ({ ...r })),
  inventoryFlows: [...initialInventoryFlows],
  productionBatches: initialProductionBatches.map((b) => ({ ...b, inboundQuantity: b.inboundQuantity ?? (b.status === '已入库' || b.status === '已结清' ? b.quantity : 0) })),
};

// ============================================================
// Reducer
// ============================================================

function businessReducer(state: BusinessState, action: BusinessAction): BusinessState {
  switch (action.type) {
    case 'PRODUCTION_INBOUND': {
      const result = registerProductionInbound(state, action.command, warehouses);
      return {
        inventoryRecords: result.inventoryRecords,
        inventoryFlows: [result.newFlow, ...state.inventoryFlows],
        productionBatches: state.productionBatches.map((b) =>
          b.id === result.updatedBatch?.id ? result.updatedBatch : b,
        ),
      };
    }
    case 'MANUAL_INBOUND': {
      const result = registerManualInbound(state, action.command, warehouses);
      return {
        inventoryRecords: result.inventoryRecords,
        inventoryFlows: [result.newFlow, ...state.inventoryFlows],
        productionBatches: state.productionBatches,
      };
    }
    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

interface BusinessContextValue extends BusinessState {
  dispatch: React.Dispatch<BusinessAction>;
  /** 便捷方法：生产入库 */
  productionInbound: (command: ProductionInboundCommand) => void;
  /** 便捷方法：手工入库 */
  manualInbound: (command: ManualInboundCommand) => void;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(businessReducer, initialState);

  const productionInbound = (command: ProductionInboundCommand) => {
    dispatch({ type: 'PRODUCTION_INBOUND', command });
  };

  const manualInbound = (command: ManualInboundCommand) => {
    dispatch({ type: 'MANUAL_INBOUND', command });
  };

  return (
    <BusinessContext.Provider value={{ ...state, dispatch, productionInbound, manualInbound }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessState(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error('useBusinessState must be used within a BusinessProvider');
  }
  return ctx;
}
