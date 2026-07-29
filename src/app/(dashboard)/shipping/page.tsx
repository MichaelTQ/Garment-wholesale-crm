'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { orders, shipments, warehouses, formatCurrency, getStatusColor } from '@/lib/mock-data';
import { toast } from 'sonner';

const pendingOrders = orders.filter(o => ['已确认', '部分发货'].includes(o.status));

export default function ShippingPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-medium">待发货订单</h3>
            <p className="text-xs text-muted-foreground mt-1">共 {pendingOrders.length} 个订单待发货</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">订单编号</TableHead>
                <TableHead className="text-xs">客户</TableHead>
                <TableHead className="text-xs text-right">订单总件数</TableHead>
                <TableHead className="text-xs text-right">已发货件数</TableHead>
                <TableHead className="text-xs text-right">待发货件数</TableHead>
                <TableHead className="text-xs">订单日期</TableHead>
                <TableHead className="text-xs text-center">状态</TableHead>
                <TableHead className="text-xs text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingOrders.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="text-xs font-medium">{o.orderNo}</TableCell>
                  <TableCell className="text-xs">
                    <Link href={`/customers/${o.customerId}`} className="hover:text-[#1e3a5f] hover:underline">{o.customerName}</Link>
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{o.totalQuantity}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-green-600">{o.shippedQuantity}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-orange-600 font-medium">{o.pendingShipQuantity}</TableCell>
                  <TableCell className="text-xs">{o.orderDate}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(o.status)}`}>{o.status}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelectedOrder(o.id); setShowCreateDialog(true); }}>
                        创建发货单
                      </Button>
                      <Link href="/orders">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">查看订单</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Shipment History */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-medium">发货记录</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">发货单号</TableHead>
                <TableHead className="text-xs">客户</TableHead>
                <TableHead className="text-xs">对应订单</TableHead>
                <TableHead className="text-xs">发货日期</TableHead>
                <TableHead className="text-xs">发货仓库</TableHead>
                <TableHead className="text-xs">物流方式</TableHead>
                <TableHead className="text-xs text-right">商品数量</TableHead>
                <TableHead className="text-xs text-right">发货金额</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs font-medium">{s.shipmentNo}</TableCell>
                  <TableCell className="text-xs">{s.customerName}</TableCell>
                  <TableCell className="text-xs">{s.orderNo}</TableCell>
                  <TableCell className="text-xs">{s.shipDate}</TableCell>
                  <TableCell className="text-xs">{s.warehouseName}</TableCell>
                  <TableCell className="text-xs">{s.logisticsMethod}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{s.totalItems}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{formatCurrency(s.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Shipment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建发货单</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>发货仓库 *</Label>
                <Select><SelectTrigger><SelectValue placeholder="选择仓库" /></SelectTrigger>
                  <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>物流方式</Label>
                <Select><SelectTrigger><SelectValue placeholder="选择物流" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="海运">海运</SelectItem>
                    <SelectItem value="空运">空运</SelectItem>
                    <SelectItem value="陆运">陆运</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>物流单号</Label>
                <Input placeholder="输入物流单号" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <textarea className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm" rows={2} placeholder="发货备注..." />
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">款号</TableHead>
                    <TableHead className="text-xs">颜色</TableHead>
                    <TableHead className="text-xs">尺码</TableHead>
                    <TableHead className="text-xs text-right">订单数量</TableHead>
                    <TableHead className="text-xs text-right">已发数量</TableHead>
                    <TableHead className="text-xs text-right">本次发货</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder && orders.find(o => o.id === selectedOrder)?.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{item.styleNo}</TableCell>
                      <TableCell className="text-xs">{item.color}</TableCell>
                      <TableCell className="text-xs">{item.size}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{item.quantity}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">0</TableCell>
                      <TableCell><Input type="number" className="h-7 text-xs w-16 text-right" placeholder="0" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>取消</Button>
            <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={() => { setShowCreateDialog(false); toast.success('发货成功，实际库存已减少，相关预留库存已释放。'); }}>确认发货</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
