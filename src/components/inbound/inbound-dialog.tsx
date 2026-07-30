'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProductFormFields } from '@/components/products/product-form-fields';
import { useBusinessState } from '@/lib/state/provider';
import { warehouses, getStatusColor } from '@/lib/mock-data';
import {
  canBatchInbound,
  getRemainingInboundQuantity,
  validateManualInbound,
  validateProductionInbound,
} from '@/lib/services/inventory';
import {
  emptyProductFormValue,
  productFromFormValue,
  productToFormValue,
  splitFormList,
  type ProductFormValue,
} from '@/lib/types/product';
import type { InboundFormData, InboundType, ManualInboundCommand } from '@/lib/types/inventory';
import { toast } from 'sonner';

interface InboundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultBatchId?: string;
}

type ProductMode = 'existing' | 'new';

interface SkuInboundRow {
  id: string;
  color: string;
  size: string;
  sku: string;
  warehouseId: string;
  quantity: number;
}

const initialFormData: InboundFormData = {
  inboundType: '生产入库',
  batchId: '',
  warehouseId: '',
  quantity: 0,
  date: '',
  reason: '',
  notes: '',
};

function createSkuCode(styleNo: string, color: string, size: string): string {
  const normalize = (value: string) =>
    value
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '-')
      .replace(/[^A-Z0-9\u4E00-\u9FFF-]/g, '');
  return [styleNo, color, size].map(normalize).filter(Boolean).join('-');
}

function createSkuRow(id = 'sku-1', styleNo = '', color = '', size = ''): SkuInboundRow {
  return {
    id,
    color,
    size,
    sku: createSkuCode(styleNo, color, size),
    warehouseId: '',
    quantity: 0,
  };
}

export function InboundDialog({ open, onOpenChange, defaultBatchId }: InboundDialogProps) {
  const {
    products,
    productionBatches,
    productionInbound,
    manualInbound,
    newProductInbound,
  } = useBusinessState();
  const [formData, setFormData] = useState<InboundFormData>({
    ...initialFormData,
    batchId: defaultBatchId ?? '',
  });
  const [productMode, setProductMode] = useState<ProductMode>('existing');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [newProduct, setNewProduct] = useState<ProductFormValue>(emptyProductFormValue);
  const [skuRows, setSkuRows] = useState<SkuInboundRow[]>([createSkuRow()]);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))],
    [products],
  );
  const selectedBatch = productionBatches.find((batch) => batch.id === formData.batchId);
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const batchProduct = products.find((product) =>
    product.id === selectedBatch?.productId || product.styleNo === selectedBatch?.styleNo,
  );
  const inboundableBatches = productionBatches.filter(canBatchInbound);
  const remaining = selectedBatch ? getRemainingInboundQuantity(selectedBatch) : 0;
  const newColors = splitFormList(newProduct.colors);
  const newSizes = splitFormList(newProduct.sizes);

  useEffect(() => {
    if (!open) return;
    setFormData((current) => ({
      ...current,
      date: current.date || new Date().toISOString().split('T')[0],
      batchId: defaultBatchId ?? current.batchId,
      inboundType: defaultBatchId ? '生产入库' : current.inboundType,
    }));
  }, [open, defaultBatchId]);

  useEffect(() => {
    if (!selectedBatch || formData.inboundType !== '生产入库') return;
    setFormData((current) => ({
      ...current,
      warehouseId: selectedBatch.warehouseId,
      quantity: 0,
    }));
  }, [selectedBatch, formData.inboundType]);

  const resetForm = () => {
    setFormData({ ...initialFormData, batchId: defaultBatchId ?? '' });
    setProductMode('existing');
    setSelectedProductId('');
    setSelectedColor('');
    setSelectedSize('');
    setNewProduct(emptyProductFormValue);
    setSkuRows([createSkuRow()]);
    setErrors([]);
    setSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const updateSkuRow = (id: string, update: Partial<SkuInboundRow>) => {
    setSkuRows((current) => current.map((row) => {
      if (row.id !== id) return row;
      const next = { ...row, ...update };
      if ('color' in update || 'size' in update) {
        next.sku = createSkuCode(newProduct.styleNo, next.color, next.size);
      }
      return next;
    }));
  };

  const submitProductionInbound = () => {
    const command = {
      type: '生产入库' as const,
      batchId: formData.batchId,
      warehouseId: formData.warehouseId,
      quantity: formData.quantity,
      date: formData.date,
      notes: formData.notes,
    };
    const validation = validateProductionInbound(command, selectedBatch, warehouses);
    if (!validation.valid) return validation.errors;
    productionInbound(command);
    toast.success(`生产入库成功，${command.quantity} 件已入库`);
    return [];
  };

  const submitExistingProductInbound = () => {
    if (!selectedProduct) return ['请选择已有商品'];
    const command: ManualInboundCommand = {
      type: '手工入库',
      styleNo: selectedProduct.styleNo,
      productName: selectedProduct.name,
      color: selectedColor,
      size: selectedSize,
      warehouseId: formData.warehouseId,
      quantity: formData.quantity,
      date: formData.date,
      reason: formData.reason,
      notes: formData.notes,
    };
    const validation = validateManualInbound(command, warehouses);
    if (!validation.valid) return validation.errors;
    manualInbound(command);
    toast.success(`商品入库成功，${command.quantity} 件已入库`);
    return [];
  };

  const submitNewProductInbound = () => {
    const validationErrors: string[] = [];
    const styleNo = newProduct.styleNo.trim();
    if (!styleNo) validationErrors.push('请输入款号');
    if (products.some((product) => product.styleNo.toLowerCase() === styleNo.toLowerCase())) {
      validationErrors.push('该款号已经存在，请改用“已有商品入库”');
    }
    if (!newProduct.name.trim()) validationErrors.push('请输入商品名称');
    if (!newProduct.category) validationErrors.push('请选择商品分类');
    if (newProduct.suggestedPrice < 0) validationErrors.push('建议销售价不能为负数');
    if (newColors.length === 0) validationErrors.push('请至少填写一种颜色');
    if (newSizes.length === 0) validationErrors.push('请至少填写一个尺码');
    if (skuRows.length === 0) validationErrors.push('请至少添加一条 SKU 入库明细');
    if (!formData.date) validationErrors.push('请选择入库日期');
    if (!formData.reason) validationErrors.push('请选择入库原因');

    const skuKeys = new Set<string>();
    const skuCodes = new Set<string>();
    skuRows.forEach((row, index) => {
      const rowNo = index + 1;
      if (!newColors.includes(row.color)) validationErrors.push(`第 ${rowNo} 行请选择有效颜色`);
      if (!newSizes.includes(row.size)) validationErrors.push(`第 ${rowNo} 行请选择有效尺码`);
      if (!row.sku.trim()) validationErrors.push(`第 ${rowNo} 行缺少 SKU 编码`);
      if (!warehouses.some((warehouse) => warehouse.id === row.warehouseId)) {
        validationErrors.push(`第 ${rowNo} 行请选择入库仓库`);
      }
      if (!Number.isInteger(row.quantity) || row.quantity <= 0) {
        validationErrors.push(`第 ${rowNo} 行入库数量必须为大于 0 的整数`);
      }
      const skuKey = `${row.color}|${row.size}|${row.warehouseId}`;
      if (skuKeys.has(skuKey)) validationErrors.push(`第 ${rowNo} 行的规格和仓库重复`);
      skuKeys.add(skuKey);
      const skuCode = row.sku.trim().toUpperCase();
      if (skuCodes.has(skuCode)) validationErrors.push(`第 ${rowNo} 行 SKU 编码重复`);
      skuCodes.add(skuCode);
    });

    if (validationErrors.length > 0) return validationErrors;

    const product = productFromFormValue(
      newProduct,
      `p-${styleNo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    );
    const entries: ManualInboundCommand[] = skuRows.map((row) => ({
      type: '手工入库',
      styleNo: product.styleNo,
      productName: product.name,
      color: row.color,
      size: row.size,
      warehouseId: row.warehouseId,
      quantity: row.quantity,
      date: formData.date,
      reason: formData.reason,
      notes: `${row.sku}${formData.notes ? `；${formData.notes}` : ''}`,
    }));
    newProductInbound({ product, entries });
    toast.success(`新商品创建成功，${entries.reduce((sum, entry) => sum + entry.quantity, 0)} 件已入库`);
    return [];
  };

  const handleSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    setErrors([]);
    try {
      const nextErrors = formData.inboundType === '生产入库'
        ? submitProductionInbound()
        : productMode === 'existing'
          ? submitExistingProductInbound()
          : submitNewProductInbound();
      if (nextErrors.length > 0) {
        setErrors([...new Set(nextErrors)]);
        setSubmitting(false);
        return;
      }
      handleOpenChange(false);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : '入库失败']);
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>商品入库</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-3">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">1. 入库方式</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>入库类型 *</Label>
                <Select
                  value={formData.inboundType}
                  onValueChange={(value) => {
                    setFormData((current) => ({
                      ...current,
                      inboundType: value as InboundType,
                      batchId: '',
                      warehouseId: '',
                      quantity: 0,
                    }));
                    setErrors([]);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="生产入库">生产入库</SelectItem>
                    <SelectItem value="手工入库">手工入库 / 期初库存</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.inboundType === '手工入库' && (
                <div className="space-y-2">
                  <Label>商品来源 *</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={productMode === 'existing' ? 'default' : 'outline'}
                      onClick={() => setProductMode('existing')}
                    >
                      已有商品入库
                    </Button>
                    <Button
                      type="button"
                      variant={productMode === 'new' ? 'default' : 'outline'}
                      onClick={() => setProductMode('new')}
                    >
                      新商品并入库
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {formData.inboundType === '生产入库' && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">2. 生产批次与商品资料</h3>
              <div className="space-y-2">
                <Label>生产批次 *</Label>
                <Select
                  value={formData.batchId}
                  onValueChange={(batchId) => setFormData((current) => ({ ...current, batchId }))}
                >
                  <SelectTrigger><SelectValue placeholder="选择生产批次" /></SelectTrigger>
                  <SelectContent>
                    {inboundableBatches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.batchNo ?? batch.id.toUpperCase()} · {batch.styleNo} · {batch.color}/{batch.size} · 剩余 {getRemainingInboundQuantity(batch)} 件
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBatch && (
                <>
                  <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3 text-xs md:grid-cols-5">
                    <div><span className="text-muted-foreground">工厂：</span>{selectedBatch.factoryName}</div>
                    <div><span className="text-muted-foreground">生产数量：</span>{selectedBatch.quantity} 件</div>
                    <div><span className="text-muted-foreground">已入库：</span>{selectedBatch.inboundQuantity ?? 0} 件</div>
                    <div><span className="text-muted-foreground">剩余：</span><strong>{remaining} 件</strong></div>
                    <div>
                      <span className="text-muted-foreground">状态：</span>
                      <Badge variant="secondary" className={getStatusColor(selectedBatch.status)}>{selectedBatch.status}</Badge>
                    </div>
                  </div>
                  {batchProduct && (
                    <ProductFormFields
                      value={productToFormValue(batchProduct)}
                      onChange={() => undefined}
                      categories={categories}
                      disabled
                    />
                  )}
                </>
              )}
            </section>
          )}

          {formData.inboundType === '手工入库' && productMode === 'existing' && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">2. 已有商品资料</h3>
              <div className="space-y-2">
                <Label>选择商品 *</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={(productId) => {
                    setSelectedProductId(productId);
                    setSelectedColor('');
                    setSelectedSize('');
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="按款号选择商品" /></SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.styleNo} - {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <>
                  <ProductFormFields
                    value={productToFormValue(selectedProduct)}
                    onChange={() => undefined}
                    categories={categories}
                    disabled
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>本次入库颜色 *</Label>
                      <Select value={selectedColor} onValueChange={setSelectedColor}>
                        <SelectTrigger><SelectValue placeholder="选择颜色" /></SelectTrigger>
                        <SelectContent>
                          {selectedProduct.colors.map((color) => (
                            <SelectItem key={color.name} value={color.name}>{color.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>本次入库尺码 *</Label>
                      <Select value={selectedSize} onValueChange={setSelectedSize}>
                        <SelectTrigger><SelectValue placeholder="选择尺码" /></SelectTrigger>
                        <SelectContent>
                          {selectedProduct.sizes.map((size) => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {formData.inboundType === '手工入库' && productMode === 'new' && (
            <section className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold">2. 新商品资料</h3>
                <p className="mt-1 text-xs text-muted-foreground">这里与“商品管理 → 新增商品”复用同一套字段和校验。</p>
              </div>
              <ProductFormFields
                value={newProduct}
                onChange={(value) => {
                  setNewProduct(value);
                  setSkuRows((current) => current.map((row) => ({
                    ...row,
                    sku: createSkuCode(value.styleNo, row.color, row.size),
                  })));
                }}
                categories={categories}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">SKU 首次入库明细</h4>
                    <p className="text-xs text-muted-foreground">每个颜色、尺码和仓库分别记录库存。</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSkuRows((current) => [
                      ...current,
                      createSkuRow(`sku-${Date.now().toString(36)}`, newProduct.styleNo),
                    ])}
                  >
                    <Plus className="mr-1 h-4 w-4" />添加 SKU
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <table className="min-w-[780px] w-full">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-2 text-left text-xs font-medium">颜色 *</th>
                        <th className="p-2 text-left text-xs font-medium">尺码 *</th>
                        <th className="p-2 text-left text-xs font-medium">SKU 编码 *</th>
                        <th className="p-2 text-left text-xs font-medium">入库仓库 *</th>
                        <th className="p-2 text-left text-xs font-medium">数量 *</th>
                        <th className="w-12 p-2"><span className="sr-only">操作</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {skuRows.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="p-2">
                            <Select value={row.color} onValueChange={(color) => updateSkuRow(row.id, { color })}>
                              <SelectTrigger className="h-9"><SelectValue placeholder="颜色" /></SelectTrigger>
                              <SelectContent>
                                {newColors.map((color) => <SelectItem key={color} value={color}>{color}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2">
                            <Select value={row.size} onValueChange={(size) => updateSkuRow(row.id, { size })}>
                              <SelectTrigger className="h-9"><SelectValue placeholder="尺码" /></SelectTrigger>
                              <SelectContent>
                                {newSizes.map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2">
                            <Input
                              value={row.sku}
                              onChange={(event) => updateSkuRow(row.id, { sku: event.target.value })}
                              placeholder="自动生成，可修改"
                            />
                          </td>
                          <td className="p-2">
                            <Select value={row.warehouseId} onValueChange={(warehouseId) => updateSkuRow(row.id, { warehouseId })}>
                              <SelectTrigger className="h-9"><SelectValue placeholder="仓库" /></SelectTrigger>
                              <SelectContent>
                                {warehouses.map((warehouse) => (
                                  <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min={1}
                              value={row.quantity || ''}
                              onChange={(event) => updateSkuRow(row.id, { quantity: Number(event.target.value) })}
                              className="w-24"
                            />
                          </td>
                          <td className="p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="删除 SKU 明细"
                              disabled={skuRows.length === 1}
                              onClick={() => setSkuRows((current) => current.filter((item) => item.id !== row.id))}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          <Separator />

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              {formData.inboundType === '生产入库' ? '3. 入库信息' : '3. 入库单信息'}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {formData.inboundType === '生产入库' && (
                <>
                  <div className="space-y-2">
                    <Label>入库仓库 *</Label>
                    <Select
                      value={formData.warehouseId}
                      onValueChange={(warehouseId) => setFormData((current) => ({ ...current, warehouseId }))}
                    >
                      <SelectTrigger><SelectValue placeholder="选择仓库" /></SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>本次入库数量 *（最多 {remaining} 件）</Label>
                    <Input
                      type="number"
                      min={1}
                      max={remaining}
                      value={formData.quantity || ''}
                      onChange={(event) => setFormData((current) => ({ ...current, quantity: Number(event.target.value) }))}
                    />
                  </div>
                </>
              )}

              {formData.inboundType === '手工入库' && productMode === 'existing' && (
                <>
                  <div className="space-y-2">
                    <Label>入库仓库 *</Label>
                    <Select
                      value={formData.warehouseId}
                      onValueChange={(warehouseId) => setFormData((current) => ({ ...current, warehouseId }))}
                    >
                      <SelectTrigger><SelectValue placeholder="选择仓库" /></SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
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
                      onChange={(event) => setFormData((current) => ({ ...current, quantity: Number(event.target.value) }))}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>入库日期 *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(event) => setFormData((current) => ({ ...current, date: event.target.value }))}
                />
              </div>
              {formData.inboundType === '手工入库' && (
                <div className="space-y-2">
                  <Label>入库原因 *</Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(reason) => setFormData((current) => ({ ...current, reason }))}
                  >
                    <SelectTrigger><SelectValue placeholder="选择原因" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="期初库存">期初库存</SelectItem>
                      <SelectItem value="盘点调整">盘点调整</SelectItem>
                      <SelectItem value="历史数据迁移">历史数据迁移</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label>备注</Label>
                <Input
                  value={formData.notes}
                  onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="选填"
                />
              </div>
            </div>
          </section>

          {errors.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3" role="alert">
              {errors.map((error) => (
                <p key={error} className="text-sm text-red-700">{error}</p>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>取消</Button>
          <Button
            className="bg-[#1e3a5f] hover:bg-[#2d5a8e]"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '提交中…' : '确认入库'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
