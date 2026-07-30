'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency, getStatusColor } from '@/lib/mock-data';
import { useParams, useRouter } from 'next/navigation';
import { useBusinessState } from '@/lib/state/provider';
import { InboundDialog } from '@/components/inbound/inbound-dialog';
import { canBatchInbound, getRemainingInboundQuantity } from '@/lib/services/inventory';

export default function FactoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const factoryId = params.id as string;
  const { factories, factoryPayments, productionBatches } = useBusinessState();
  const factory = factories.find(f => f.id === factoryId);

  const [showInboundDialog, setShowInboundDialog] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  if (!factory) {
    return <div className="text-center py-12">工厂不存在</div>;
  }

  const relatedBatches = productionBatches.filter(b => b.factoryId === factory.id);
  const relatedPayments = factoryPayments.filter(p => p.factoryId === factory.id);

  const handleInboundClick = (batchId: string) => {
    setSelectedBatchId(batchId);
    setShowInboundDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 返回
        </Button>
        <h2 className="text-lg font-semibold">{factory.name}</h2>
        <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700">合作中</Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">累计生产金额</p>
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(factory.totalProductionAmount)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">已付款</p>
            <p className="text-lg font-semibold tabular-nums text-green-600">{formatCurrency(factory.paidAmount)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">未付款</p>
            <p className="text-lg font-semibold tabular-nums text-red-600">{formatCurrency(factory.unpaidAmount)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">生产批次</p>
            <p className="text-lg font-semibold tabular-nums">{relatedBatches.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="bg-white">
          <TabsTrigger value="info">工厂资料</TabsTrigger>
          <TabsTrigger value="batches">生产批次</TabsTrigger>
          <TabsTrigger value="payments">付款记录</TabsTrigger>
          <TabsTrigger value="transactions">应付款流水</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">基本信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">工厂编号</span><span>{factory.id.toUpperCase()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">工厂名称</span><span className="font-medium">{factory.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">联系人</span><span>{factory.contact}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">电话</span><span>{factory.phone}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">地址</span><span>{factory.address}</span></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">生产信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">主要生产</span><span>{factory.mainCategory}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">最近合作</span><span>{factory.lastCoopDate}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">累计生产金额</span><span className="font-medium">{formatCurrency(factory.totalProductionAmount)}</span></div>
                  </div>
                </div>
              </div>
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
                  {relatedBatches.map(b => {
                    const remaining = getRemainingInboundQuantity(b);
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="text-xs font-medium">{b.batchNo || b.id.toUpperCase()}</TableCell>
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
                    <TableHead className="text-xs">付款日期</TableHead>
                    <TableHead className="text-xs text-right">付款金额</TableHead>
                    <TableHead className="text-xs">付款方式</TableHead>
                    <TableHead className="text-xs">关联批次</TableHead>
                    <TableHead className="text-xs">备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedPayments.map(fp => (
                    <TableRow key={fp.id}>
                      <TableCell className="text-xs font-medium">{fp.paymentNo}</TableCell>
                      <TableCell className="text-xs">{fp.paymentDate}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-green-600 font-medium">{formatCurrency(fp.amount)}</TableCell>
                      <TableCell className="text-xs">{fp.method}</TableCell>
                      <TableCell className="text-xs">{fp.relatedBatchNo}</TableCell>
                      <TableCell className="text-xs">{fp.notes}</TableCell>
                    </TableRow>
                  ))}
                  {relatedPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">暂无付款记录</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">日期</TableHead>
                    <TableHead className="text-xs">类型</TableHead>
                    <TableHead className="text-xs">单据编号</TableHead>
                    <TableHead className="text-xs">说明</TableHead>
                    <TableHead className="text-xs text-right">增加应付</TableHead>
                    <TableHead className="text-xs text-right">支付款项</TableHead>
                    <TableHead className="text-xs text-right">余额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedBatches.map((b, i) => {
                    const balance = relatedBatches.slice(0, i + 1).reduce((s, bb) => s + bb.totalCost - bb.paidAmount, 0);
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="text-xs">{b.inboundDate || '-'}</TableCell>
                        <TableCell className="text-xs">生产入库</TableCell>
                        <TableCell className="text-xs">{b.batchNo || b.id.toUpperCase()}</TableCell>
                        <TableCell className="text-xs">{b.styleNo} {b.productName} {b.color}/{b.size} x{b.quantity}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{formatCurrency(b.totalCost)}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums text-green-600">{b.paidAmount > 0 ? formatCurrency(b.paidAmount) : '-'}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums font-medium">{formatCurrency(balance)}</TableCell>
                      </TableRow>
                    );
                  })}
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
