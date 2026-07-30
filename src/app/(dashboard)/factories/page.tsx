'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { factories, factoryPayments, formatCurrency, getStatusColor } from '@/lib/mock-data';
import { useBusinessState } from '@/lib/state/provider';
import { InboundDialog } from '@/components/inbound/inbound-dialog';
import { canBatchInbound, getRemainingInboundQuantity } from '@/lib/services/inventory';

export default function FactoriesPage() {
  const { productionBatches } = useBusinessState();
  const [activeTab, setActiveTab] = useState('list');
  const [showInboundDialog, setShowInboundDialog] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  const totalUnpaid = factories.reduce((s, f) => s + f.unpaidAmount, 0);

  const handleInboundClick = (batchId: string) => {
    setSelectedBatchId(batchId);
    setShowInboundDialog(true);
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
        <TabsList className="bg-white">
          <TabsTrigger value="list">工厂列表</TabsTrigger>
          <TabsTrigger value="batches">生产批次</TabsTrigger>
          <TabsTrigger value="payments">付款记录</TabsTrigger>
        </TabsList>

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
    </div>
  );
}
