'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MessageCircle, ShoppingCart, Wallet, Edit } from 'lucide-react';
import { customers, orders, payments, shipments, customerLedgers, formatCurrency, getStatusColor } from '@/lib/mock-data';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const customer = customers.find(c => c.id === customerId);
  const [activeTab, setActiveTab] = useState('overview');

  if (!customer) {
    return <div className="text-center py-12">客户不存在</div>;
  }

  const customerOrders = orders.filter(o => o.customerId === customerId);
  const customerPayments = payments.filter(p => p.customerId === customerId);
  const customerShipments = shipments.filter(s => s.customerId === customerId);
  const ledger = customerLedgers[customerId] || [];

  const summaryCards = [
    { label: '累计销售额', value: formatCurrency(customer.totalSales) },
    { label: '当前订单应收', value: formatCurrency(customer.orderReceivable), color: 'text-orange-600' },
    { label: '已发货实际欠款', value: formatCurrency(customer.shippedDebt), color: 'text-red-600' },
    { label: '客户预存余额', value: formatCurrency(customer.presaveBalance), color: 'text-blue-600' },
    { label: '待发货数量', value: `${customerOrders.reduce((sum, o) => sum + o.pendingShipQuantity, 0)}件` },
    { label: '最近购买时间', value: customer.lastPurchaseDate },
  ];

  return (
    <div className="space-y-4">
      {/* Back & Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 返回
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[#1f2937]">{customer.name}</h2>
                <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${getStatusColor(customer.status)}`}>
                  {customer.status}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>国家：{customer.country}</span>
                <span>城市：{customer.city}</span>
                <span>WhatsApp：{customer.whatsapp}</span>
                <span>编号：{customer.id.toUpperCase()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast.info('打开WhatsApp对话')}>
                <MessageCircle className="h-4 w-4 mr-1" /> 联系WhatsApp
              </Button>
              <Button variant="outline" size="sm">
                <ShoppingCart className="h-4 w-4 mr-1" /> 新建订单
              </Button>
              <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={() => toast.info('打开收款登记')}>
                <Wallet className="h-4 w-4 mr-1" /> 登记收款
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" /> 编辑
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {summaryCards.map((card) => (
          <Card key={card.label} className="shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className={`text-base font-semibold tabular-nums mt-1 ${card.color || 'text-[#1f2937]'}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white">
          <TabsTrigger value="overview">客户概览</TabsTrigger>
          <TabsTrigger value="orders">销售订单</TabsTrigger>
          <TabsTrigger value="shipments">发货记录</TabsTrigger>
          <TabsTrigger value="payments">收款记录</TabsTrigger>
          <TabsTrigger value="ledger">往来流水</TabsTrigger>
          <TabsTrigger value="habits">购买习惯</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-medium text-[#1f2937]">基本资料</h3>
                  <Separator />
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <span className="text-muted-foreground">客户编号</span><span>{customer.id.toUpperCase()}</span>
                    <span className="text-muted-foreground">客户名称</span><span>{customer.name}</span>
                    <span className="text-muted-foreground">国家</span><span>{customer.country}</span>
                    <span className="text-muted-foreground">城市</span><span>{customer.city}</span>
                    <span className="text-muted-foreground">创建时间</span><span>{customer.createdAt}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium text-[#1f2937]">联系方式</h3>
                  <Separator />
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <span className="text-muted-foreground">WhatsApp</span><span>{customer.whatsapp}</span>
                  </div>
                  <h3 className="font-medium text-[#1f2937] mt-6">购买偏好</h3>
                  <Separator />
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <span className="text-muted-foreground">常买品类</span><span>{customer.categories.join('、')}</span>
                    <span className="text-muted-foreground">常买尺码</span><span>{customer.commonSizes.join('、')}</span>
                    <span className="text-muted-foreground">平均订单金额</span><span>{formatCurrency(customer.avgOrderAmount)}</span>
                    <span className="text-muted-foreground">购买频率</span><span>{customer.purchaseFrequency}</span>
                    <span className="text-muted-foreground">最近购买时间</span><span>{customer.lastPurchaseDate}</span>
                  </div>
                </div>
              </div>
              {customer.notes && (
                <div className="mt-6">
                  <Separator />
                  <div className="mt-4">
                    <h3 className="font-medium text-[#1f2937] mb-2">客户备注</h3>
                    <p className="text-sm text-muted-foreground bg-[#f5f6fa] p-3 rounded-lg">{customer.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">订单编号</TableHead>
                    <TableHead className="text-xs">下单日期</TableHead>
                    <TableHead className="text-xs text-right">订单金额</TableHead>
                    <TableHead className="text-xs text-right">已收金额</TableHead>
                    <TableHead className="text-xs text-right">未收金额</TableHead>
                    <TableHead className="text-xs text-right">订单件数</TableHead>
                    <TableHead className="text-xs text-right">已发货</TableHead>
                    <TableHead className="text-xs text-right">待发货</TableHead>
                    <TableHead className="text-xs text-center">状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerOrders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="text-xs font-medium">
                        <Link href="/orders" className="hover:text-[#1e3a5f] hover:underline">{o.orderNo}</Link>
                      </TableCell>
                      <TableCell className="text-xs">{o.orderDate}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{formatCurrency(o.totalAmount)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{formatCurrency(o.paidAmount)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-orange-600">{formatCurrency(o.unpaidAmount)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{o.totalQuantity}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{o.shippedQuantity}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{o.pendingShipQuantity}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(o.status)}`}>{o.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipments" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">发货单号</TableHead>
                    <TableHead className="text-xs">发货日期</TableHead>
                    <TableHead className="text-xs">对应订单</TableHead>
                    <TableHead className="text-xs">发货仓库</TableHead>
                    <TableHead className="text-xs text-right">商品数量</TableHead>
                    <TableHead className="text-xs text-right">发货金额</TableHead>
                    <TableHead className="text-xs">备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerShipments.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-medium">{s.shipmentNo}</TableCell>
                      <TableCell className="text-xs">{s.shipDate}</TableCell>
                      <TableCell className="text-xs">{s.orderNo}</TableCell>
                      <TableCell className="text-xs">{s.warehouseName}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{s.totalItems}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{formatCurrency(s.totalAmount)}</TableCell>
                      <TableCell className="text-xs">{s.notes}</TableCell>
                    </TableRow>
                  ))}
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
                    <TableHead className="text-xs">收款编号</TableHead>
                    <TableHead className="text-xs">收款日期</TableHead>
                    <TableHead className="text-xs text-right">收款金额</TableHead>
                    <TableHead className="text-xs">付款方式</TableHead>
                    <TableHead className="text-xs">关联订单</TableHead>
                    <TableHead className="text-xs">备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerPayments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs font-medium">{p.paymentNo}</TableCell>
                      <TableCell className="text-xs">{p.paymentDate}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-green-600">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="text-xs">{p.method}</TableCell>
                      <TableCell className="text-xs">{p.relatedOrderNo}</TableCell>
                      <TableCell className="text-xs">{p.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">日期</TableHead>
                    <TableHead className="text-xs">业务类型</TableHead>
                    <TableHead className="text-xs">单据编号</TableHead>
                    <TableHead className="text-xs">业务说明</TableHead>
                    <TableHead className="text-xs text-right">增加应收</TableHead>
                    <TableHead className="text-xs text-right">收到款项</TableHead>
                    <TableHead className="text-xs text-right">余额</TableHead>
                    <TableHead className="text-xs">备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{l.date}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{l.businessType}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{l.docNo}</TableCell>
                      <TableCell className="text-xs">{l.description}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-orange-600">{l.increaseReceivable ? formatCurrency(l.increaseReceivable) : ''}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-green-600">{l.receivedAmount ? formatCurrency(l.receivedAmount) : ''}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums font-medium">{formatCurrency(l.balance)}</TableCell>
                      <TableCell className="text-xs">{l.notes}</TableCell>
                    </TableRow>
                  ))}
                  {ledger.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                        暂无往来流水数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habits" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">最常购买品类</p>
                <p className="text-sm font-semibold mt-1">{customer.categories.join('、')}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">常买尺码</p>
                <p className="text-sm font-semibold mt-1">{customer.commonSizes.join('、')}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">平均订单金额</p>
                <p className="text-sm font-semibold tabular-nums mt-1">{formatCurrency(customer.avgOrderAmount)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">购买频率</p>
                <p className="text-sm font-semibold mt-1">{customer.purchaseFrequency}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">订单总数</p>
                <p className="text-sm font-semibold tabular-nums mt-1">{customerOrders.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">最近90天订单</p>
                <p className="text-sm font-semibold tabular-nums mt-1">{customerOrders.filter(o => new Date(o.orderDate) > new Date('2025-04-25')).length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">距离上次购买</p>
                <p className="text-sm font-semibold tabular-nums mt-1">{Math.floor((new Date('2025-07-25').getTime() - new Date(customer.lastPurchaseDate).getTime()) / 86400000)}天</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">客户信用状态</p>
                <p className="text-sm font-semibold mt-1">
                  <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${getStatusColor(customer.status)}`}>{customer.status}</Badge>
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
