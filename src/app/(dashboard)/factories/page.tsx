'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, getStatusColor, type FactoryPayment } from '@/lib/mock-data';
import { useBusinessState } from '@/lib/state/provider';
import { InboundDialog } from '@/components/inbound/inbound-dialog';
import { canBatchInbound, getRemainingInboundQuantity } from '@/lib/services/inventory';
import { toast } from 'sonner';

export default function FactoriesPage() {
  const {
    factories,
    factoryPayments,
    productionBatches,
    products,
    warehouses,
    addFactory,
    createProductionBatch,
    createFactoryPayment,
  } = useBusinessState();
  const [activeTab, setActiveTab] = useState('list');
  const [showInboundDialog, setShowInboundDialog] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [showFactoryDialog, setShowFactoryDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [factoryForm, setFactoryForm] = useState({
    name: '',
    contact: '',
    phone: '',
    mainCategory: '',
    address: '',
    notes: '',
  });
  const [batchFactoryId, setBatchFactoryId] = useState('');
  const [batchProductId, setBatchProductId] = useState('');
  const [batchColor, setBatchColor] = useState('');
  const [batchSize, setBatchSize] = useState('');
  const [batchQuantity, setBatchQuantity] = useState(0);
  const [batchUnitCost, setBatchUnitCost] = useState(0);
  const [batchWarehouseId, setBatchWarehouseId] = useState('');
  const [batchDate, setBatchDate] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [paymentFactoryId, setPaymentFactoryId] = useState('');
  const [paymentBatchId, setPaymentBatchId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<FactoryPayment['method']>('银行转账');
  const [paymentVoucher, setPaymentVoucher] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setBatchDate(today);
    setPaymentDate(today);
  }, []);

  const selectedBatchProduct = products.find((product) => product.id === batchProductId);
  const payableBatches = productionBatches.filter(
    (batch) => batch.factoryId === paymentFactoryId && batch.unpaidAmount > 0,
  );
  const selectedPaymentBatch = productionBatches.find((batch) => batch.id === paymentBatchId);

  const totalUnpaid = factories.reduce((s, f) => s + f.unpaidAmount, 0);

  const handleInboundClick = (batchId: string) => {
    setSelectedBatchId(batchId);
    setShowInboundDialog(true);
  };

  const submitFactory = () => {
    const result = addFactory(factoryForm);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setShowFactoryDialog(false);
    setFactoryForm({ name: '', contact: '', phone: '', mainCategory: '', address: '', notes: '' });
    toast.success('工厂创建成功');
  };

  const submitBatch = () => {
    const result = createProductionBatch({
      factoryId: batchFactoryId,
      productId: batchProductId,
      color: batchColor,
      size: batchSize,
      quantity: batchQuantity,
      unitCost: batchUnitCost,
      inboundWarehouseId: batchWarehouseId,
      startDate: batchDate,
      notes: batchNotes,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setShowBatchDialog(false);
    setBatchFactoryId('');
    setBatchProductId('');
    setBatchColor('');
    setBatchSize('');
    setBatchQuantity(0);
    setBatchUnitCost(0);
    setBatchWarehouseId('');
    setBatchNotes('');
    toast.success('生产批次创建成功，可在批次列表登记生产入库');
  };

  const submitFactoryPayment = () => {
    const result = createFactoryPayment({
      factoryId: paymentFactoryId,
      batchId: paymentBatchId,
      paymentDate,
      amount: paymentAmount,
      method: paymentMethod,
      voucher: paymentVoucher,
      notes: paymentNotes,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setShowPaymentDialog(false);
    setPaymentFactoryId('');
    setPaymentBatchId('');
    setPaymentAmount(0);
    setPaymentVoucher('');
    setPaymentNotes('');
    toast.success('工厂付款已登记，批次及工厂应付金额已同步更新');
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">工厂数量</p>
            <p className="text-lg font-semibold tabular-nums">{factories.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">累计生产金额</p>
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(factories.reduce((s, f) => s + f.totalProductionAmount, 0))}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">已付款</p>
            <p className="text-lg font-semibold tabular-nums text-green-600">{formatCurrency(factories.reduce((s, f) => s + f.paidAmount, 0))}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">未付款</p>
            <p className="text-lg font-semibold tabular-nums text-red-600">{formatCurrency(totalUnpaid)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className="bg-white">
            <TabsTrigger value="list">工厂列表</TabsTrigger>
            <TabsTrigger value="batches">生产批次</TabsTrigger>
            <TabsTrigger value="payments">付款记录</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowFactoryDialog(true)}>新增工厂</Button>
            <Button size="sm" variant="outline" onClick={() => setShowBatchDialog(true)}>新建生产批次</Button>
            <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={() => setShowPaymentDialog(true)}>登记工厂付款</Button>
          </div>
        </div>

        <TabsContent value="list" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">工厂编号</TableHead>
                    <TableHead className="text-xs">工厂名称</TableHead>
                    <TableHead className="text-xs">联系人</TableHead>
                    <TableHead className="text-xs">电话</TableHead>
                    <TableHead className="text-xs">主要生产</TableHead>
                    <TableHead className="text-xs text-right">累计生产金额</TableHead>
                    <TableHead className="text-xs text-right">已付款</TableHead>
                    <TableHead className="text-xs text-right">未付款</TableHead>
                    <TableHead className="text-xs">最近合作</TableHead>
                    <TableHead className="text-xs text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factories.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="text-xs">{f.id.toUpperCase()}</TableCell>
                      <TableCell className="text-xs font-medium">{f.name}</TableCell>
                      <TableCell className="text-xs">{f.contact}</TableCell>
                      <TableCell className="text-xs">{f.phone}</TableCell>
                      <TableCell className="text-xs">{f.mainCategory}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{formatCurrency(f.totalProductionAmount)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-green-600">{formatCurrency(f.paidAmount)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-red-600">{formatCurrency(f.unpaidAmount)}</TableCell>
                      <TableCell className="text-xs">{f.lastCoopDate}</TableCell>
                      <TableCell className="text-center">
                        <Link href={`/factories/${f.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">详情</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {factories.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="h-24 text-center text-sm text-muted-foreground">暂无工厂，请先新增工厂</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">批次编号</TableHead>
                    <TableHead className="text-xs">工厂</TableHead>
                    <TableHead className="text-xs">款号</TableHead>
                    <TableHead className="text-xs">商品</TableHead>
                    <TableHead className="text-xs">颜色</TableHead>
                    <TableHead className="text-xs">尺码</TableHead>
                    <TableHead className="text-xs text-right">生产数量</TableHead>
                    <TableHead className="text-xs text-right">已入库</TableHead>
                    <TableHead className="text-xs text-right">剩余</TableHead>
                    <TableHead className="text-xs text-right">单件成本</TableHead>
                    <TableHead className="text-xs text-right">总成本</TableHead>
                    <TableHead className="text-xs text-right">已付</TableHead>
                    <TableHead className="text-xs text-right">未付</TableHead>
                    <TableHead className="text-xs text-center">状态</TableHead>
                    <TableHead className="text-xs text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productionBatches.map(b => {
                    const remaining = getRemainingInboundQuantity(b);
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="text-xs font-medium">{b.batchNo || b.id.toUpperCase()}</TableCell>
                        <TableCell className="text-xs">{b.factoryName}</TableCell>
                        <TableCell className="text-xs">{b.styleNo}</TableCell>
                        <TableCell className="text-xs">{b.productName}</TableCell>
                        <TableCell className="text-xs">{b.color}</TableCell>
                        <TableCell className="text-xs">{b.size}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{b.quantity}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{b.inboundQuantity ?? 0}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums font-medium text-green-600">{remaining}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{formatCurrency(b.unitCost)}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{formatCurrency(b.totalCost)}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums text-green-600">{formatCurrency(b.paidAmount)}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums text-red-600">{formatCurrency(b.unpaidAmount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(b.status)}`}>{b.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {canBatchInbound(b) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleInboundClick(b.id)}
                              aria-label={`登记入库 ${b.id.toUpperCase()}`}
                            >
                              登记入库
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {productionBatches.length === 0 && (
                    <TableRow><TableCell colSpan={15} className="h-24 text-center text-sm text-muted-foreground">暂无生产批次</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">付款编号</TableHead>
                    <TableHead className="text-xs">工厂</TableHead>
                    <TableHead className="text-xs">付款日期</TableHead>
                    <TableHead className="text-xs text-right">付款金额</TableHead>
                    <TableHead className="text-xs">付款方式</TableHead>
                    <TableHead className="text-xs">关联批次</TableHead>
                    <TableHead className="text-xs">备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factoryPayments.map(fp => (
                    <TableRow key={fp.id}>
                      <TableCell className="text-xs font-medium">{fp.paymentNo}</TableCell>
                      <TableCell className="text-xs">{fp.factoryName}</TableCell>
                      <TableCell className="text-xs">{fp.paymentDate}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-green-600 font-medium">{formatCurrency(fp.amount)}</TableCell>
                      <TableCell className="text-xs">{fp.method}</TableCell>
                      <TableCell className="text-xs">{fp.relatedBatchNo}</TableCell>
                      <TableCell className="text-xs">{fp.notes}</TableCell>
                    </TableRow>
                  ))}
                  {factoryPayments.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">暂无工厂付款记录</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 入库弹窗 */}
      <InboundDialog
        open={showInboundDialog}
        onOpenChange={setShowInboundDialog}
        defaultBatchId={selectedBatchId}
      />

      <Dialog open={showFactoryDialog} onOpenChange={setShowFactoryDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>新增工厂</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>工厂名称 *</Label><Input value={factoryForm.name} onChange={(event) => setFactoryForm((current) => ({ ...current, name: event.target.value }))} /></div>
              <div className="space-y-2"><Label>主要生产品类</Label><Input value={factoryForm.mainCategory} onChange={(event) => setFactoryForm((current) => ({ ...current, mainCategory: event.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>联系人</Label><Input value={factoryForm.contact} onChange={(event) => setFactoryForm((current) => ({ ...current, contact: event.target.value }))} /></div>
              <div className="space-y-2"><Label>联系电话</Label><Input value={factoryForm.phone} onChange={(event) => setFactoryForm((current) => ({ ...current, phone: event.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>地址</Label><Input value={factoryForm.address} onChange={(event) => setFactoryForm((current) => ({ ...current, address: event.target.value }))} /></div>
            <div className="space-y-2"><Label>备注</Label><textarea className="w-full rounded-md border px-3 py-2 text-sm" rows={2} value={factoryForm.notes} onChange={(event) => setFactoryForm((current) => ({ ...current, notes: event.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowFactoryDialog(false)}>取消</Button><Button onClick={submitFactory}>保存工厂</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>新建生产批次</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>工厂 *</Label>
                <Select value={batchFactoryId} onValueChange={setBatchFactoryId}><SelectTrigger><SelectValue placeholder="选择工厂" /></SelectTrigger><SelectContent>{factories.map((factory) => <SelectItem key={factory.id} value={factory.id}>{factory.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label>商品 *</Label>
                <Select value={batchProductId} onValueChange={(value) => { setBatchProductId(value); setBatchColor(''); setBatchSize(''); }}><SelectTrigger><SelectValue placeholder="选择商品" /></SelectTrigger><SelectContent>{products.map((product) => <SelectItem key={product.id} value={product.id}>{product.styleNo} - {product.name}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>颜色 *</Label><Select value={batchColor} onValueChange={setBatchColor}><SelectTrigger><SelectValue placeholder="选择颜色" /></SelectTrigger><SelectContent>{selectedBatchProduct?.colors.map((color) => <SelectItem key={color.name} value={color.name}>{color.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>尺码 *</Label><Select value={batchSize} onValueChange={setBatchSize}><SelectTrigger><SelectValue placeholder="选择尺码" /></SelectTrigger><SelectContent>{selectedBatchProduct?.sizes.map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>生产数量 *</Label><Input type="number" min={1} step={1} value={batchQuantity || ''} onChange={(event) => setBatchQuantity(Number(event.target.value))} /></div>
              <div className="space-y-2"><Label>单件成本 *</Label><Input type="number" min={0} step="0.01" value={batchUnitCost || ''} onChange={(event) => setBatchUnitCost(Number(event.target.value))} /></div>
              <div className="space-y-2"><Label>总成本</Label><Input value={formatCurrency(batchQuantity * batchUnitCost)} readOnly className="bg-gray-50" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>计划入库仓库 *</Label><Select value={batchWarehouseId} onValueChange={setBatchWarehouseId}><SelectTrigger><SelectValue placeholder="选择仓库" /></SelectTrigger><SelectContent>{warehouses.map((warehouse) => <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>生产日期 *</Label><Input type="date" value={batchDate} onChange={(event) => setBatchDate(event.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>备注</Label><textarea className="w-full rounded-md border px-3 py-2 text-sm" rows={2} value={batchNotes} onChange={(event) => setBatchNotes(event.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowBatchDialog(false)}>取消</Button><Button onClick={submitBatch}>创建批次</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>登记工厂付款</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>工厂 *</Label><Select value={paymentFactoryId} onValueChange={(value) => { setPaymentFactoryId(value); setPaymentBatchId(''); }}><SelectTrigger><SelectValue placeholder="选择工厂" /></SelectTrigger><SelectContent>{factories.map((factory) => <SelectItem key={factory.id} value={factory.id}>{factory.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>生产批次 *</Label><Select value={paymentBatchId} onValueChange={setPaymentBatchId}><SelectTrigger><SelectValue placeholder="选择未结清批次" /></SelectTrigger><SelectContent>{payableBatches.map((batch) => <SelectItem key={batch.id} value={batch.id}>{batch.batchNo} - 未付 {formatCurrency(batch.unpaidAmount)}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>付款日期 *</Label><Input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} /></div>
              <div className="space-y-2"><Label>付款金额 *</Label><Input type="number" min={0} max={selectedPaymentBatch?.unpaidAmount} step="0.01" value={paymentAmount || ''} onChange={(event) => setPaymentAmount(Number(event.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>付款方式 *</Label><Select value={paymentMethod} onValueChange={(value: FactoryPayment['method']) => setPaymentMethod(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['银行转账', '微信', '支付宝', '现金', '其他'].map((entry) => <SelectItem key={entry} value={entry}>{entry}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>凭证编号/地址</Label><Input value={paymentVoucher} onChange={(event) => setPaymentVoucher(event.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>备注</Label><textarea className="w-full rounded-md border px-3 py-2 text-sm" rows={2} value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowPaymentDialog(false)}>取消</Button><Button onClick={submitFactoryPayment}>确认付款</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
