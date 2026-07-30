'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownRight, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';
import { useBusinessState } from '@/lib/state/provider';
import { selectMonthlySalesData } from '@/lib/selectors/business';

export default function FinancePage() {
  const business = useBusinessState();
  const { customers, products, productionBatches, shipments } = business;
  const shippedSales = shipments.reduce((sum, shipment) => sum + shipment.totalAmount, 0);
  const totalSales = shippedSales;
  const totalReceivable = customers.reduce((sum, customer) => sum + customer.shippedDebt, 0);
  const totalOrderReceivable = customers.reduce((sum, customer) => sum + customer.orderReceivable, 0);
  const totalPreDeposit = customers.reduce((sum, customer) => sum + customer.preDeposit, 0);
  const shippedItems = shipments.flatMap((shipment) => shipment.items);
  const totalCost = shippedItems.reduce((sum, item) => {
    const batches = productionBatches
      .filter((batch) => batch.styleNo === item.styleNo)
      .sort((left, right) => right.inboundDate.localeCompare(left.inboundDate));
    return sum + (batches[0]?.unitCost ?? 0) * item.thisShipQty;
  }, 0);
  const totalProfit = shippedSales - totalCost;
  const profitRate = shippedSales > 0 ? ((totalProfit / shippedSales) * 100).toFixed(1) : '0';
  const totalFactoryPayable = productionBatches.reduce((sum, batch) => sum + batch.unpaidAmount, 0);
  const monthlyData = selectMonthlySalesData(business);
  const maxSales = Math.max(1, ...monthlyData.map((item) => item.sales));
  const customerProfitData = customers.map((customer) => {
    const customerShipments = shipments.filter((shipment) => shipment.customerId === customer.id);
    const sales = customerShipments.reduce((sum, shipment) => sum + shipment.totalAmount, 0);
    const cost = customerShipments.flatMap((shipment) => shipment.items).reduce((sum, item) => {
      const batch = productionBatches
        .filter((entry) => entry.styleNo === item.styleNo)
        .sort((left, right) => right.inboundDate.localeCompare(left.inboundDate))[0];
      return sum + (batch?.unitCost ?? 0) * item.thisShipQty;
    }, 0);
    const profit = sales - cost;
    return { ...customer, sales, cost, profit, rate: sales > 0 ? ((profit / sales) * 100).toFixed(1) : '0' };
  }).sort((left, right) => right.profit - left.profit);
  const productProfitData = products.map((product) => {
    const items = shippedItems.filter((item) => item.styleNo === product.styleNo);
    const soldQty = items.reduce((sum, item) => sum + item.thisShipQty, 0);
    const sales = items.reduce((sum, item) => sum + item.thisShipAmount, 0);
    const batch = productionBatches
      .filter((entry) => entry.styleNo === product.styleNo)
      .sort((left, right) => right.inboundDate.localeCompare(left.inboundDate))[0];
    const cost = soldQty * (batch?.unitCost ?? 0);
    const profit = sales - cost;
    return { ...product, soldQty, sales, cost, profit, rate: sales > 0 ? ((profit / sales) * 100).toFixed(1) : '0' };
  }).sort((left, right) => right.profit - left.profit);
  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview">
        <TabsList className="bg-white">
          <TabsTrigger value="overview">销售概览</TabsTrigger>
          <TabsTrigger value="trend">月度趋势</TabsTrigger>
          <TabsTrigger value="customer-profit">客户利润</TabsTrigger>
          <TabsTrigger value="product-profit">商品利润</TabsTrigger>
          <TabsTrigger value="receivable-payable">应收应付</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">总销售额</p>
                    <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalSales)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <ArrowDownRight className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">已销售商品成本</p>
                    <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalCost)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">销售利润</p>
                    <p className="text-lg font-semibold tabular-nums text-green-600">{formatCurrency(totalProfit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">利润率</p>
                    <p className="text-lg font-semibold tabular-nums">{profitRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mini trend chart */}
          <Card className="shadow-sm mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">近6月销售趋势</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {monthlyData.slice(-6).map(d => (
                  <div key={d.month} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">{d.month.slice(5)}月</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="h-2.5 rounded-full bg-[#1e3a5f]" style={{ width: `${(d.sales / maxSales) * 100}%` }} />
                        <span className="text-[10px] text-muted-foreground shrink-0">{formatCurrency(d.sales)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 rounded-full bg-green-400" style={{ width: `${(d.profit / maxSales) * 100}%` }} />
                        <span className="text-[10px] text-green-600 shrink-0">{formatCurrency(d.profit)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 pt-1">
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-4 rounded bg-[#1e3a5f]" /><span className="text-[10px] text-muted-foreground">销售额</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-4 rounded bg-green-400" /><span className="text-[10px] text-muted-foreground">利润</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">月度趋势（近12个月）</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {monthlyData.map(d => (
                  <div key={d.month} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{d.month}</span>
                      <div className="flex gap-4 text-xs">
                        <span>销售额: <span className="font-medium">{formatCurrency(d.sales)}</span></span>
                        <span>成本: <span className="font-medium">{formatCurrency(d.cost)}</span></span>
                        <span className="text-green-600">利润: <span className="font-medium">{formatCurrency(d.profit)}</span></span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3 rounded bg-[#1e3a5f]/80" style={{ width: `${(d.sales / maxSales) * 100}%` }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 rounded bg-orange-300" style={{ width: `${(d.cost / maxSales) * 100}%` }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 rounded bg-green-400" style={{ width: `${(d.profit / maxSales) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 pt-2">
                  <div className="flex items-center gap-1.5"><div className="h-3 w-4 rounded bg-[#1e3a5f]/80" /><span className="text-xs text-muted-foreground">销售额</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-3 w-4 rounded bg-orange-300" /><span className="text-xs text-muted-foreground">工厂成本</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-3 w-4 rounded bg-green-400" /><span className="text-xs text-muted-foreground">销售利润</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer-profit" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">排名</TableHead>
                    <TableHead className="text-xs">客户</TableHead>
                    <TableHead className="text-xs">国家</TableHead>
                    <TableHead className="text-xs text-right">销售额</TableHead>
                    <TableHead className="text-xs text-right">商品成本</TableHead>
                    <TableHead className="text-xs text-right">销售利润</TableHead>
                    <TableHead className="text-xs text-right">利润率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerProfitData.slice(0, 10).map((c, i) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs font-medium">{i + 1}</TableCell>
                      <TableCell className="text-xs font-medium">{c.name}</TableCell>
                      <TableCell className="text-xs">{c.country}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{formatCurrency(c.sales)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{formatCurrency(c.cost)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-green-600 font-medium">{formatCurrency(c.profit)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{c.rate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product-profit" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">排名</TableHead>
                    <TableHead className="text-xs">款号</TableHead>
                    <TableHead className="text-xs">商品</TableHead>
                    <TableHead className="text-xs text-right">销售数量</TableHead>
                    <TableHead className="text-xs text-right">销售额</TableHead>
                    <TableHead className="text-xs text-right">商品成本</TableHead>
                    <TableHead className="text-xs text-right">利润</TableHead>
                    <TableHead className="text-xs text-right">利润率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productProfitData.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs font-medium">{i + 1}</TableCell>
                      <TableCell className="text-xs">{p.styleNo}</TableCell>
                      <TableCell className="text-xs">{p.name}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{p.soldQty}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{formatCurrency(p.sales)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{formatCurrency(p.cost)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-green-600 font-medium">{formatCurrency(p.profit)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{p.rate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivable-payable" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">客户订单应收</p>
                <p className="text-lg font-semibold tabular-nums text-orange-600">{formatCurrency(totalOrderReceivable)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">客户已发货欠款</p>
                <p className="text-lg font-semibold tabular-nums text-red-600">{formatCurrency(totalReceivable)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">客户预存余额</p>
                <p className="text-lg font-semibold tabular-nums text-blue-600">{formatCurrency(totalPreDeposit)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">工厂应付款</p>
                <p className="text-lg font-semibold tabular-nums text-red-600">{formatCurrency(totalFactoryPayable)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
