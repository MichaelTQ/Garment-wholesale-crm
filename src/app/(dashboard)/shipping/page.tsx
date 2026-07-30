'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, getStatusColor } from '@/lib/mock-data';
import { useBusinessState } from '@/lib/state/provider';

export default function ShippingPage() {
  const { orders, shipments, createShipment } = useBusinessState();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [shipDate, setShipDate] = useState('');
  const [logisticsMethod, setLogisticsMethod] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const [notes, setNotes] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    setShipDate(new Date().toISOString().slice(0, 10));
  }, []);

  const pendingOrders = orders.filter((order) =>
    ['已确认', '部分发货'].includes(order.status),
  );
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);

  const openShipmentDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setQuantities({});
    setTrackingNo('');
    setLogisticsMethod('');
    setNotes('');
    setShowCreateDialog(true);
  };

  const submitShipment = () => {
    if (!selectedOrder) {
      toast.error('订单不存在');
      return;
    }
    const result = createShipment({
      orderId: selectedOrder.id,
      shipDate,
      logisticsMethod,
      trackingNo,
      notes,
      items: selectedOrder.items.map((item) => ({
        orderItemId: item.id,
        quantity: quantities[item.id] ?? 0,
      })),
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setShowCreateDialog(false);
    toast.success('发货成功：实际库存与预留库存已同步减少');
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="border-b p-4">
            <h3 className="font-medium">待发货订单</h3>
            <p className="mt-1 text-xs text-muted-foreground">共 {pendingOrders.length} 个订单待发货</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">订单编号</TableHead>
                <TableHead className="text-xs">客户</TableHead>
                <TableHead className="text-right text-xs">订单总件数</TableHead>
                <TableHead className="text-right text-xs">已发货件数</TableHead>
                <TableHead className="text-right text-xs">待发货件数</TableHead>
                <TableHead className="text-xs">订单日期</TableHead>
                <TableHead className="text-center text-xs">状态</TableHead>
                <TableHead className="text-center text-xs">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-xs font-medium">{order.orderNo}</TableCell>
                  <TableCell className="text-xs">
                    <Link href={`/customers/${order.customerId}`} className="hover:text-[#1e3a5f] hover:underline">{order.customerName}</Link>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{order.totalQuantity}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-green-600">{order.shippedQuantity}</TableCell>
                  <TableCell className="text-right text-xs font-medium tabular-nums text-orange-600">{order.pendingShipQuantity}</TableCell>
                  <TableCell className="text-xs">{order.orderDate}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={`px-1.5 py-0 text-[10px] ${getStatusColor(order.status)}`}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openShipmentDialog(order.id)}>
                        创建发货单
                      </Button>
                      <Link href={`/orders/${order.id}/receipt`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">Receipt</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pendingOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                    暂无待发货订单；订单确认并成功预留库存后会出现在这里
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="border-b p-4"><h3 className="font-medium">发货记录</h3></div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">发货单号</TableHead>
                <TableHead className="text-xs">客户</TableHead>
                <TableHead className="text-xs">对应订单</TableHead>
                <TableHead className="text-xs">发货日期</TableHead>
                <TableHead className="text-xs">发货仓库</TableHead>
                <TableHead className="text-xs">物流方式 / 单号</TableHead>
                <TableHead className="text-right text-xs">商品数量</TableHead>
                <TableHead className="text-right text-xs">发货金额</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell className="text-xs font-medium">{shipment.shipmentNo}</TableCell>
                  <TableCell className="text-xs">{shipment.customerName}</TableCell>
                  <TableCell className="text-xs">{shipment.orderNo}</TableCell>
                  <TableCell className="text-xs">{shipment.shipDate}</TableCell>
                  <TableCell className="text-xs">{shipment.warehouseName}</TableCell>
                  <TableCell className="text-xs">{shipment.logisticsMethod || '-'}{shipment.trackingNo ? ` / ${shipment.trackingNo}` : ''}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{shipment.totalItems}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{formatCurrency(shipment.totalAmount)}</TableCell>
                </TableRow>
              ))}
              {shipments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-20 text-center text-sm text-muted-foreground">暂无发货记录</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>创建发货单 · {selectedOrder?.orderNo}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>发货日期 *</Label>
                <Input type="date" value={shipDate} onChange={(event) => setShipDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>物流方式</Label>
                <Select value={logisticsMethod} onValueChange={setLogisticsMethod}>
                  <SelectTrigger><SelectValue placeholder="选择物流" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="海运">海运</SelectItem>
                    <SelectItem value="空运">空运</SelectItem>
                    <SelectItem value="陆运">陆运</SelectItem>
                    <SelectItem value="客户自提">客户自提</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>物流单号</Label>
                <Input value={trackingNo} onChange={(event) => setTrackingNo(event.target.value)} placeholder="输入物流单号" />
              </div>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">SKU</TableHead>
                    <TableHead className="text-xs">出货仓库</TableHead>
                    <TableHead className="text-right text-xs">订单数量</TableHead>
                    <TableHead className="text-right text-xs">已发</TableHead>
                    <TableHead className="text-right text-xs">待发</TableHead>
                    <TableHead className="text-right text-xs">本次发货</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder?.items.map((item) => {
                    const remaining = item.quantity - item.shippedQuantity;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs">{item.styleNo} · {item.color} · {item.size}</TableCell>
                        <TableCell className="text-xs">{item.warehouseName}</TableCell>
                        <TableCell className="text-right text-xs">{item.quantity}</TableCell>
                        <TableCell className="text-right text-xs text-green-600">{item.shippedQuantity}</TableCell>
                        <TableCell className="text-right text-xs text-orange-600">{remaining}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={remaining}
                            step={1}
                            className="ml-auto h-8 w-20 text-right text-xs"
                            value={quantities[item.id] || ''}
                            onChange={(event) => setQuantities((current) => ({
                              ...current,
                              [item.id]: Number(event.target.value),
                            }))}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <textarea className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="发货备注..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>取消</Button>
            <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={submitShipment}>确认发货</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
