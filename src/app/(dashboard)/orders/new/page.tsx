'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { customers, products, warehouses, formatCurrency } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NewOrderPage() {
  const router = useRouter();
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState<Array<{
    id: string; styleNo: string; productName: string; color: string; size: string;
    warehouseId: string; warehouseName: string; availableStock: number;
    quantity: number; unitPrice: number; subtotal: number;
  }>>([]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const addOrderItem = () => {
    setOrderItems([...orderItems, {
      id: `item-${Date.now()}`,
      styleNo: '', productName: '', color: '', size: '',
      warehouseId: '', warehouseName: '', availableStock: 0,
      quantity: 0, unitPrice: 0, subtotal: 0,
    }]);
  };

  const removeOrderItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const updateOrderItem = (id: string, field: string, value: string | number) => {
    setOrderItems(orderItems.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'styleNo') {
        const product = products.find(p => p.styleNo === value);
        if (product) {
          updated.productName = product.name;
          updated.unitPrice = product.suggestedPrice;
        }
      }
      if (field === 'quantity' || field === 'unitPrice') {
        updated.subtotal = Number(updated.quantity) * Number(updated.unitPrice);
      }
      return updated;
    }));
  };

  const totalQuantity = orderItems.reduce((sum, item) => sum + Number(item.quantity), 0);
  const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const presaveDeduction = 0;
  const finalReceivable = totalAmount - presaveDeduction;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 返回
        </Button>
        <h2 className="text-lg font-semibold">新建销售订单</h2>
      </div>

      {/* Customer Info */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base">客户信息</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>选择客户 *</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger><SelectValue placeholder="请选择客户" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedCustomer && (
              <>
                <div className="space-y-2">
                  <Label>国家</Label>
                  <Input value={selectedCustomer.country} readOnly className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={selectedCustomer.whatsapp} readOnly className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>当前欠款</Label>
                  <Input value={formatCurrency(selectedCustomer.shippedDebt)} readOnly className="bg-gray-50 text-orange-600" />
                </div>
              </>
            )}
          </div>
          {selectedCustomer && selectedCustomer.presaveBalance > 0 && (
            <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
              客户预存余额：{formatCurrency(selectedCustomer.presaveBalance)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">订单商品明细</CardTitle>
            <Button size="sm" variant="outline" onClick={addOrderItem}>
              <Plus className="h-4 w-4 mr-1" /> 添加商品
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">款号</TableHead>
                  <TableHead className="text-xs">商品名称</TableHead>
                  <TableHead className="text-xs">颜色</TableHead>
                  <TableHead className="text-xs">尺码</TableHead>
                  <TableHead className="text-xs">仓库</TableHead>
                  <TableHead className="text-xs text-right">可销售库存</TableHead>
                  <TableHead className="text-xs text-right">数量</TableHead>
                  <TableHead className="text-xs text-right">销售单价</TableHead>
                  <TableHead className="text-xs text-right">小计</TableHead>
                  <TableHead className="text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Select value={item.styleNo} onValueChange={v => updateOrderItem(item.id, 'styleNo', v)}>
                        <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="选择款号" /></SelectTrigger>
                        <SelectContent>
                          {products.filter(p => p.status === '正常销售' || p.status === '已上新').map(p => (
                            <SelectItem key={p.styleNo} value={p.styleNo}>{p.styleNo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs">{item.productName}</TableCell>
                    <TableCell>
                      <Input className="h-8 text-xs w-20" value={item.color} onChange={e => updateOrderItem(item.id, 'color', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input className="h-8 text-xs w-16" value={item.size} onChange={e => updateOrderItem(item.id, 'size', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Select value={item.warehouseId} onValueChange={v => {
                        const wh = warehouses.find(w => w.id === v);
                        updateOrderItem(item.id, 'warehouseId', v);
                        if (wh) updateOrderItem(item.id, 'warehouseName', wh.name);
                      }}>
                        <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="选择仓库" /></SelectTrigger>
                        <SelectContent>
                          {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{item.availableStock || '-'}</TableCell>
                    <TableCell>
                      <Input type="number" className="h-8 text-xs w-16 text-right" value={item.quantity || ''} onChange={e => updateOrderItem(item.id, 'quantity', Number(e.target.value))} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" className="h-8 text-xs w-20 text-right" value={item.unitPrice || ''} onChange={e => updateOrderItem(item.id, 'unitPrice', Number(e.target.value))} />
                    </TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-medium">{item.subtotal ? formatCurrency(item.subtotal) : '-'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeOrderItem(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {orderItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-8">
                      点击"添加商品"开始录入订单明细
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6 text-sm">
              <span>商品总件数：<strong className="tabular-nums">{totalQuantity}</strong> 件</span>
              <span>订单总金额：<strong className="tabular-nums">{formatCurrency(totalAmount)}</strong></span>
              <span>客户预存款抵扣：<strong className="tabular-nums">{formatCurrency(presaveDeduction)}</strong></span>
              <span>最终应收金额：<strong className="tabular-nums text-[#1e3a5f]">{formatCurrency(finalReceivable)}</strong></span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>取消</Button>
              <Button variant="outline" onClick={() => toast.success('草稿已保存')}>保存草稿</Button>
              <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={() => {
                if (!selectedCustomerId) { toast.error('请先选择客户'); return; }
                if (orderItems.length === 0) { toast.error('请添加商品'); return; }
                toast.success('订单确认成功，相关库存已被预留。');
                router.push('/orders');
              }}>确认订单</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
