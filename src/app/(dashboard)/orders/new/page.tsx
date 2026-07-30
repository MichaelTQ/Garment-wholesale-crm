'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/mock-data';
import { useBusinessState } from '@/lib/state/provider';
import type { OrderItemInput } from '@/lib/types/business';

interface EditableOrderItem extends OrderItemInput {
  rowId: string;
}

function createRowId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `row-${Date.now()}`;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { customers, products, warehouses, inventoryRecords, createOrder } = useBusinessState();
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [notes, setNotes] = useState('');
  const [depositDeduction, setDepositDeduction] = useState(0);
  const [orderItems, setOrderItems] = useState<EditableOrderItem[]>([]);

  useEffect(() => {
    setOrderDate(new Date().toISOString().slice(0, 10));
  }, []);

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
  const selectableProducts = products.filter((product) => product.status !== '已停售');

  const addOrderItem = () => {
    setOrderItems((current) => [
      ...current,
      {
        rowId: createRowId(),
        productId: '',
        styleNo: '',
        productName: '',
        color: '',
        size: '',
        warehouseId: '',
        warehouseName: '',
        quantity: 0,
        unitPrice: 0,
      },
    ]);
  };

  const removeOrderItem = (rowId: string) => {
    setOrderItems((current) => current.filter((item) => item.rowId !== rowId));
  };

  const updateItem = (
    rowId: string,
    updater: (item: EditableOrderItem) => EditableOrderItem,
  ) => {
    setOrderItems((current) =>
      current.map((item) => (item.rowId === rowId ? updater(item) : item)),
    );
  };

  const chooseProduct = (rowId: string, productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    updateItem(rowId, (item) => ({
      ...item,
      productId: product.id,
      styleNo: product.styleNo,
      productName: product.name,
      color: product.colors[0]?.name ?? '',
      size: product.sizes[0] ?? '',
      warehouseId: '',
      warehouseName: '',
      quantity: 0,
      unitPrice: product.suggestedPrice,
    }));
  };

  const getStock = (item: EditableOrderItem) =>
    inventoryRecords.find(
      (record) =>
        record.styleNo === item.styleNo &&
        record.color === item.color &&
        record.size === item.size &&
        record.warehouseId === item.warehouseId,
    );

  const getAvailableWarehouses = (item: EditableOrderItem) =>
    warehouses.filter((warehouse) =>
      inventoryRecords.some(
        (record) =>
          record.warehouseId === warehouse.id &&
          record.styleNo === item.styleNo &&
          record.color === item.color &&
          record.size === item.size &&
          record.sellableStock > 0,
      ),
    );

  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const usableDeposit = Math.min(
    Math.max(0, depositDeduction),
    selectedCustomer?.presaveBalance ?? 0,
    totalAmount,
  );
  const finalReceivable = Math.max(0, totalAmount - usableDeposit);

  const submit = (confirm: boolean) => {
    const result = createOrder({
      customerId: selectedCustomerId,
      orderDate,
      items: orderItems.map((item) => ({
        productId: item.productId,
        styleNo: item.styleNo,
        productName: item.productName,
        color: item.color,
        size: item.size,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      notes,
      confirm,
      depositDeduction: confirm ? usableDeposit : 0,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      confirm
        ? '订单已确认，相关 SKU 库存已预留'
        : '订单草稿已保存，尚未占用库存',
    );
    router.push('/orders');
  };

  const duplicateSkuRows = useMemo(() => {
    const keys = orderItems.map(
      (item) => `${item.styleNo}|${item.color}|${item.size}|${item.warehouseId}`,
    );
    return new Set(keys).size !== keys.length;
  }, [orderItems]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 返回
        </Button>
        <h2 className="text-lg font-semibold">新建销售订单</h2>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base">客户信息</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>选择客户 *</Label>
              <Select value={selectedCustomerId} onValueChange={(value) => {
                setSelectedCustomerId(value);
                setDepositDeduction(0);
              }}>
                <SelectTrigger><SelectValue placeholder="请选择客户" /></SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>订单日期 *</Label>
              <Input type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} />
            </div>
            {selectedCustomer && (
              <>
                <div className="space-y-2">
                  <Label>国家 / WhatsApp</Label>
                  <Input value={`${selectedCustomer.country} / ${selectedCustomer.whatsapp}`} readOnly className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>当前预存款</Label>
                  <Input value={formatCurrency(selectedCustomer.presaveBalance)} readOnly className="bg-gray-50 text-blue-600" />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">订单商品明细</CardTitle>
            <Button size="sm" variant="outline" onClick={addOrderItem}>
              <Plus className="mr-1 h-4 w-4" /> 添加商品
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">商品/款号</TableHead>
                  <TableHead className="text-xs">颜色</TableHead>
                  <TableHead className="text-xs">尺码</TableHead>
                  <TableHead className="text-xs">仓库</TableHead>
                  <TableHead className="text-right text-xs">可销售</TableHead>
                  <TableHead className="text-right text-xs">数量</TableHead>
                  <TableHead className="text-right text-xs">销售单价</TableHead>
                  <TableHead className="text-right text-xs">小计</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item) => {
                  const product = products.find((entry) => entry.id === item.productId);
                  const availableWarehouses = getAvailableWarehouses(item);
                  const stock = getStock(item);
                  return (
                    <TableRow key={item.rowId}>
                      <TableCell>
                        <Select value={item.productId} onValueChange={(value) => chooseProduct(item.rowId, value)}>
                          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="选择商品" /></SelectTrigger>
                          <SelectContent>
                            {selectableProducts.map((entry) => (
                              <SelectItem key={entry.id} value={entry.id}>{entry.styleNo} - {entry.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.color}
                          onValueChange={(value) => updateItem(item.rowId, (current) => ({
                            ...current,
                            color: value,
                            warehouseId: '',
                            warehouseName: '',
                          }))}
                        >
                          <SelectTrigger className="h-8 w-24 text-xs"><SelectValue placeholder="颜色" /></SelectTrigger>
                          <SelectContent>
                            {product?.colors.map((color) => (
                              <SelectItem key={color.name} value={color.name}>{color.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.size}
                          onValueChange={(value) => updateItem(item.rowId, (current) => ({
                            ...current,
                            size: value,
                            warehouseId: '',
                            warehouseName: '',
                          }))}
                        >
                          <SelectTrigger className="h-8 w-20 text-xs"><SelectValue placeholder="尺码" /></SelectTrigger>
                          <SelectContent>
                            {product?.sizes.map((size) => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.warehouseId}
                          onValueChange={(value) => {
                            const warehouse = warehouses.find((entry) => entry.id === value);
                            updateItem(item.rowId, (current) => ({
                              ...current,
                              warehouseId: value,
                              warehouseName: warehouse?.name ?? '',
                            }));
                          }}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="选择有货仓库" /></SelectTrigger>
                          <SelectContent>
                            {availableWarehouses.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{stock?.sellableStock ?? '-'}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          className="h-8 w-20 text-right text-xs"
                          value={item.quantity || ''}
                          onChange={(event) => updateItem(item.rowId, (current) => ({
                            ...current,
                            quantity: Number(event.target.value),
                          }))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="h-8 w-24 text-right text-xs"
                          value={item.unitPrice || ''}
                          onChange={(event) => updateItem(item.rowId, (current) => ({
                            ...current,
                            unitPrice: Number(event.target.value),
                          }))}
                        />
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium tabular-nums">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeOrderItem(item.rowId)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {orderItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                      点击“添加商品”录入订单；只有已入库且有可销售库存的 SKU 才能选择仓库
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {duplicateSkuRows && (
            <p className="mt-2 text-xs text-orange-600">同一仓库的相同款号、颜色和尺码出现多行，建议合并数量。</p>
          )}
          <div className="mt-4 space-y-2">
            <Label>订单备注</Label>
            <textarea
              className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="订单内部备注..."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-4">
          {selectedCustomer && selectedCustomer.presaveBalance > 0 && (
            <div className="flex max-w-md items-center gap-3">
              <Label className="whitespace-nowrap">本单使用预存款</Label>
              <Input
                type="number"
                min={0}
                max={Math.min(selectedCustomer.presaveBalance, totalAmount)}
                step="0.01"
                value={depositDeduction || ''}
                onChange={(event) => setDepositDeduction(Number(event.target.value))}
              />
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                最多 {formatCurrency(Math.min(selectedCustomer.presaveBalance, totalAmount))}
              </span>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <span>商品总件数：<strong>{totalQuantity}</strong> 件</span>
              <span>订单总金额：<strong>{formatCurrency(totalAmount)}</strong></span>
              <span>预存款抵扣：<strong className="text-blue-600">{formatCurrency(usableDeposit)}</strong></span>
              <span>最终应收：<strong className="text-[#1e3a5f]">{formatCurrency(finalReceivable)}</strong></span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>取消</Button>
              <Button variant="outline" onClick={() => submit(false)}>保存草稿</Button>
              <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={() => submit(true)}>确认订单并预留库存</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
