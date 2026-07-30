'use client';

import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import {
  inventoryRecords as initialInventoryRecords,
  inventoryFlows as initialInventoryFlows,
  productionBatches as initialProductionBatches,
  products as initialProducts,
  warehouses,
} from '@/lib/mock-data';
import type { InventoryFlow, Product } from '@/lib/mock-data';
import type {
  BusinessState,
  BusinessAction,
  ProductionInboundCommand,
  ManualInboundCommand,
  NewProductInboundCommand,
} from '@/lib/types/inventory';
import {
  registerProductionInbound,
  registerManualInbound,
} from '@/lib/services/inventory';

// ============================================================
// Initial State
// ============================================================

const initialState: BusinessState = {
  products: initialProducts.map((product) => ({
    ...product,
    colors: product.colors.map((color) => ({ ...color })),
    sizes: [...product.sizes],
    images: [...product.images],
  })),
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
        products: state.products.map((product) =>
          product.styleNo === result.updatedBatch?.styleNo
            ? { ...product, currentStock: product.currentStock + action.command.quantity }
            : product,
        ),
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
        products: state.products.map((product) =>
          product.styleNo === action.command.styleNo
            ? { ...product, currentStock: product.currentStock + action.command.quantity }
            : product,
        ),
        inventoryRecords: result.inventoryRecords,
        inventoryFlows: [result.newFlow, ...state.inventoryFlows],
        productionBatches: state.productionBatches,
      };
    }
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.product],
      };
    case 'NEW_PRODUCT_INBOUND': {
      let workingState: BusinessState = {
        ...state,
        products: [...state.products, action.command.product],
      };
      const newFlows: InventoryFlow[] = [];

      action.command.entries.forEach((entry, index) => {
        const result = registerManualInbound(workingState, entry, warehouses);
        newFlows.push({ ...result.newFlow, id: `${result.newFlow.id}-${index}` });
        workingState = {
          ...workingState,
          inventoryRecords: result.inventoryRecords,
        };
      });

      const inboundQuantity = action.command.entries.reduce((sum, entry) => sum + entry.quantity, 0);
      return {
        ...workingState,
        products: workingState.products.map((product) =>
          product.id === action.command.product.id
            ? { ...product, currentStock: inboundQuantity }
            : product,
        ),
        inventoryFlows: [...newFlows, ...state.inventoryFlows],
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
  addProduct: (product: Product) => void;
  newProductInbound: (command: NewProductInboundCommand) => void;
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

  const addProduct = (product: Product) => {
    dispatch({ type: 'ADD_PRODUCT', product });
  };

  const newProductInbound = (command: NewProductInboundCommand) => {
    dispatch({ type: 'NEW_PRODUCT_INBOUND', command });
  };

  return (
    <BusinessContext.Provider value={{
      ...state,
      dispatch,
      productionInbound,
      manualInbound,
      addProduct,
      newProductInbound,
    }}>
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
