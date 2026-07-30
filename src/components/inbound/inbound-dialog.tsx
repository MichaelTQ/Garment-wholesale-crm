'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useBusinessState } from '@/lib/state/provider';
import { warehouses, products, getStatusColor } from '@/lib/mock-data';
import {
  getRemainingInboundQuantity,
  canBatchInbound,
  validateProductionInbound,
  validateManualInbound,
} from '@/lib/services/inventory';
import type { InboundType, InboundFormData } from '@/lib/types/inventory';
import type { ProductionBatch } from '@/lib/mock-data';
import { toast } from 'sonner';

interface InboundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 预选的生产批次 ID（从生产批次行内点击时传入） */
  defaultBatchId?: string;
}

const initialFormData: InboundFormData = {
  inboundType: '生产入库',
  batchId: '',
  warehouseId: '',
  quantity: 0,
  date: new Date().toISOString().split('T')[0],
  reason: '',
  notes: '',
};

export function InboundDialog({ open, onOpenChange, defaultBatchId }: InboundDialogProps) {
  const { productionBatches, productionInbound, manualInbound } = useBusinessState();
  const [formData, setFormData] = useState<InboundFormData>({
    ...initialFormData,
    batchId: defaultBatchId || '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 当 defaultBatchId 变化时更新
  useEffect(() => {
    if (defaultBatchId) {
      setFormData((prev) => ({ ...prev, batchId: defaultBatchId, inboundType: '生产入库' }));
    }
  }, [defaultBatchId]);

  // 当弹窗关闭时重置表单
  useEffect(() => {
    if (!open) {
      setFormData({ ...initialFormData, batchId: defaultBatchId || '' });
      setErrors([]);
      setSubmitting(false);
    }
  }, [open, defaultBatchId]);

  const selectedBatch = productionBatches.find((b) => b.id === formData.batchId);

  // 当选择批次时自动填充仓库
  useEffect(() => {
    if (selectedBatch && formData.inboundType === '生产入库') {
      setFormData((prev) => ({ ...prev, warehouseId: selectedBatch.warehouseId }));
    }
  }, [formData.batchId, selectedBatch, formData.inboundType]);

  // 手工入库时选择的商品
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // 可入库的批次列表
  const inboundableBatches = productionBatches.filter(canBatchInbound);

  const handleBatchChange = useCallback((batchId: string) => {
    setFormData((prev) => ({ ...prev, batchId, quantity: 0 }));
  }, []);

  const handleProductChange = useCallback((productId: string) => {
    setSelectedProductId(productId);
    setSelectedColor('');
    setSelectedSize('');
    const product = products.find((p) => p.id === productId);
    if (product) {
      setFormData((prev) => ({
        ...prev,
        quantity: 0,
      }));
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (submitting) return;
    setErrors([]);

    try {
      if (formData.inboundType === '生产入库') {
        const command = {
          type: '生产入库' as const,
          batchId: formData.batchId,
          warehouseId: formData.warehouseId,
          quantity: formData.quantity,
          date: formData.date,
          notes: formData.notes,
        };
        const result = validateProductionInbound(command, selectedBatch, warehouses);
        if (!result.valid) {
          setErrors(result.errors);
          return;
        }
        setSubmitting(true);
        // 模拟异步
        setTimeout(() => {
          productionInbound(command);
          toast.success(`生产入库成功，${formData.quantity} 件已入库`);
          setSubmitting(false);
          onOpenChange(false);
        }, 300);
      } else {
        const product = products.find((p) => p.id === selectedProductId);
        if (!product) {
          setErrors(['请选择商品']);
          return;
        }
        const command = {
          type: '手工入库' as const,
          styleNo: product.styleNo,
          productName: product.name,
          color: selectedColor,
          size: selectedSize,
          warehouseId: formData.warehouseId,
          quantity: formData.quantity,
          date: formData.date,
          reason: formData.reason,
          notes: formData.notes,
        };
        const result = validateManualInbound(command, warehouses);
        if (!result.valid) {
          setErrors(result.errors);
          return;
        }
        setSubmitting(true);
        setTimeout(() => {
          manualInbound(command);
          toast.success(`手工入库成功，${formData.quantity} 件已入库`);
          setSubmitting(false);
          onOpenChange(false);
        }, 300);
      }
    } catch (e) {
      setErrors([e instanceof Error ? e.message : '入库失败']);
      setSubmitting(false);
    }
  }, [formData, selectedBatch, selectedProductId, selectedColor, selectedSize, submitting, productionInbound, manualInbound, onOpenChange]);

  const remaining = selectedBatch ? getRemainingInboundQuantity(selectedBatch) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>商品入库</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 入库类型选择 */}
          <div className="space-y-2">
            <Label>入库类型 *</Label>
            <Select
              value={formData.inboundType}
              onValueChange={(v) => {
                setFormData((prev) => ({ ...prev, inboundType: v as InboundType, batchId: '', quantity: 0 }));
                setErrors([]);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="生产入库">生产入库</SelectItem>
                <SelectItem value="手工入库">手工入库 / 期初库存</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ========== 生产入库表单 ========== */}
          {formData.inboundType === '生产入库' && (
            <>
              {/* 选择生产批次 */}
              <div className="space-y-2">
                <Label>生产批次 *</Label>
                <Select value={formData.batchId} onValueChange={handleBatchChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择生产批次" />
                  </SelectTrigger>
                  <SelectContent>
                    {inboundableBatches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.id.toUpperCase()} - {b.styleNo} {b.productName} {b.color}/{b.size} (剩余 {getRemainingInboundQuantity(b)} 件)
                      </SelectItem>
                    ))}
                    {inboundableBatches.length === 0 && (
                      <SelectItem value="_empty" disabled>没有可入库的批次</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 批次信息展示 */}
              {selectedBatch && (
                <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-3 space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">批次编号：</span>
                      <span className="font-medium">{selectedBatch.id.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">工厂：</span>
                      <span>{selectedBatch.factoryName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">款号：</span>
                      <span className="font-medium">{selectedBatch.styleNo}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">商品：</span>
                      <span>{selectedBatch.productName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">颜色：</span>
                      <span>{selectedBatch.color}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">尺码：</span>
                      <span>{selectedBatch.size}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">生产数量：</span>
                      <span className="font-medium tabular-nums">{selectedBatch.quantity} 件</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">累计已入库：</span>
                      <span className="tabular-nums">{selectedBatch.inboundQuantity ?? 0} 件</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">剩余可入库：</span>
                      <span className="font-medium tabular-nums text-green-600">{remaining} 件</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">状态：</span>
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(selectedBatch.status)}`}>
                        {selectedBatch.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* 入库仓库 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>入库仓库 *</Label>
                  <Select
                    value={formData.warehouseId}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, warehouseId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择仓库" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>本次入库数量 * <span className="text-muted-foreground font-normal">（最多 {remaining} 件）</span></Label>
                  <Input
                    type="number"
                    min={1}
                    max={remaining}
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    aria-label="入库数量"
                  />
                </div>
              </div>
            </>
          )}

          {/* ========== 手工入库表单 ========== */}
          {formData.inboundType === '手工入库' && (
            <>
              {/* 选择商品 */}
              <div className="space-y-2">
                <Label>商品款号 *</Label>
                <Select value={selectedProductId} onValueChange={handleProductChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择商品" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.styleNo} - {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>颜色 *</Label>
                    <Select value={selectedColor} onValueChange={setSelectedColor}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择颜色" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProduct.colors.map((c) => (
                          <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>尺码 *</Label>
                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择尺码" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProduct.sizes.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>入库仓库 *</Label>
                  <Select
                    value={formData.warehouseId}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, warehouseId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择仓库" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>本次入库数量 *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    aria-label="入库数量"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>入库原因 *</Label>
                <Select
                  value={formData.reason}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, reason: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择入库原因" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="期初库存">期初库存</SelectItem>
                    <SelectItem value="盘点调整">盘点调整</SelectItem>
                    <SelectItem value="历史数据迁移">历史数据迁移</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* 公共字段：日期 + 备注 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>入库日期 *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                aria-label="入库日期"
              />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="可选"
                aria-label="备注"
              />
            </div>
          </div>

          {/* 错误提示 */}
          {errors.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              {errors.map((err, i) => (
                <p key={i} className="text-sm text-red-700">{err}</p>
              ))}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            aria-label="取消"
          >
            取消
          </Button>
          <Button
            className="bg-[#1e3a5f] hover:bg-[#2d5a8e]"
            onClick={handleSubmit}
            disabled={submitting}
            aria-label="确认入库"
          >
            {submitting ? '提交中...' : '确认入库'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
