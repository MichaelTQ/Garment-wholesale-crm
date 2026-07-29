'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { inventoryRecords, inventoryFlows, warehouses, products, formatCurrency, getStatusColor } from '@/lib/mock-data';
import { toast } from 'sonner';

const totalActual = inventoryRecords.reduce((s, r) => s + r.actualStock, 0);
const totalReserved = inventoryRecords.reduce((s, r) => s + r.reservedStock, 0);
const totalSellable = inventoryRecords.reduce((s, r) => s + r.sellableStock, 0);
const lowStockCount = inventoryRecords.filter(r => r.status === '低库存' || r.status === '缺货').length;

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState('全部');

  const summaryCards = [
    { label: '实际库存总量', value: `${totalActual.toLocaleString()}件` },
    { label: '已预留库存', value: `${totalReserved.toLocaleString()}件` },
    { label: '可销售库存', value: `${totalSellable.toLocaleString()}件` },
    { label: '低库存商品', value: `${lowStockCount}款`, color: 'text-red-600' },
  ];

  const filteredRecords = warehouseFilter === '全部'
    ? inventoryRecords
    : inventoryRecords.filter(r => r.warehouseId === warehouseFilter);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {summaryCards.map(card => (
          <Card key={card.label} className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className={`text-lg font-semibold tabular-nums mt-1 ${card.color || ''}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-white">
            <TabsTrigger value="summary">库存汇总</TabsTrigger>
            <TabsTrigger value="warehouse">仓库库存</TabsTrigger>
            <TabsTrigger value="flow">库存流水</TabsTrigger>
            <TabsTrigger value="transfer">仓库调拨</TabsTrigger>
          </TabsList>
          <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="按仓库筛选" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="全部">全部仓库</SelectItem>
              {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="summary" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">款号</TableHead>
                    <TableHead className="text-xs">商品名称</TableHead>
                    <TableHead className="text-xs">颜色</TableHead>
                    <TableHead className="text-xs">尺码</TableHead>
                    <TableHead className="text-xs text-right">实际库存</TableHead>
                    <TableHead className="text-xs text-right">已预留</TableHead>
                    <TableHead className="text-xs text-right">可销售库存</TableHead>
                    <TableHead className="text-xs text-center">状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs font-medium">{r.styleNo}</TableCell>
                      <TableCell className="text-xs">{r.productName}</TableCell>
                      <TableCell className="text-xs">{r.color}</TableCell>
                      <TableCell className="text-xs">{r.size}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{r.actualStock}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-orange-600">{r.reservedStock}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums font-medium">{r.sellableStock}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(r.status)}`}>{r.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouse" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">仓库</TableHead>
                    <TableHead className="text-xs">款号</TableHead>
                    <TableHead className="text-xs">颜色</TableHead>
                    <TableHead className="text-xs">尺码</TableHead>
                    <TableHead className="text-xs text-right">实际库存</TableHead>
                    <TableHead className="text-xs text-right">已预留</TableHead>
                    <TableHead className="text-xs text-right">可销售库存</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{r.warehouseName}</TableCell>
                      <TableCell className="text-xs font-medium">{r.styleNo}</TableCell>
                      <TableCell className="text-xs">{r.color}</TableCell>
                      <TableCell className="text-xs">{r.size}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{r.actualStock}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-orange-600">{r.reservedStock}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums font-medium">{r.sellableStock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">日期</TableHead>
                    <TableHead className="text-xs">类型</TableHead>
                    <TableHead className="text-xs">商品</TableHead>
                    <TableHead className="text-xs">仓库</TableHead>
                    <TableHead className="text-xs text-right">变动数量</TableHead>
                    <TableHead className="text-xs text-right">变动前</TableHead>
                    <TableHead className="text-xs text-right">变动后</TableHead>
                    <TableHead className="text-xs">关联单据</TableHead>
                    <TableHead className="text-xs">备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryFlows.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="text-xs">{f.date}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{f.type}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{f.product}</TableCell>
                      <TableCell className="text-xs">{f.warehouse}</TableCell>
                      <TableCell className={`text-xs text-right tabular-nums font-medium ${f.quantity > 0 ? 'text-green-600' : f.quantity < 0 ? 'text-red-600' : ''}`}>
                        {f.quantity > 0 ? '+' : ''}{f.quantity}
                      </TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{f.beforeStock}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{f.afterStock}</TableCell>
                      <TableCell className="text-xs">{f.relatedDoc}</TableCell>
                      <TableCell className="text-xs">{f.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">仓库调拨</CardTitle>
                <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={() => setShowTransferDialog(true)}>
                  新建调拨
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-8 text-center">暂无调拨记录，点击"新建调拨"创建</p>
            </CardContent>
          </Card>

          <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>新建仓库调拨</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>调出仓库 *</Label>
                    <Select><SelectTrigger><SelectValue placeholder="选择调出仓库" /></SelectTrigger>
                      <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>调入仓库 *</Label>
                    <Select><SelectTrigger><SelectValue placeholder="选择调入仓库" /></SelectTrigger>
                      <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>商品款号 *</Label>
                    <Select><SelectTrigger><SelectValue placeholder="选择商品" /></SelectTrigger>
                      <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.styleNo}>{p.styleNo} - {p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>调拨数量 *</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>颜色</Label>
                    <Input placeholder="选择颜色" />
                  </div>
                  <div className="space-y-2">
                    <Label>尺码</Label>
                    <Input placeholder="选择尺码" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>备注</Label>
                  <textarea className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm" rows={2} placeholder="调拨原因..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTransferDialog(false)}>取消</Button>
                <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={() => { setShowTransferDialog(false); toast.success('调拨单创建成功'); }}>确认调拨</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
