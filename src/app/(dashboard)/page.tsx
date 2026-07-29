'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, DollarSign, Package, AlertTriangle, ShoppingCart, Warehouse } from 'lucide-react';
import { customers, orders, inventoryRecords, monthlySalesData, formatCurrency, getStatusColor } from '@/lib/mock-data';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';

const statsCards = [
  { title: '本月销售额', value: '¥286,500', icon: DollarSign, color: 'text-[#1e3a5f]', bg: 'bg-[#e8eef6]' },
  { title: '本月销售利润', value: '¥82,300', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  { title: '客户应收总额', value: '¥765,240', icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
  { title: '已发货实际欠款', value: '¥438,600', icon: DollarSign, color: 'text-red-600', bg: 'bg-red-50' },
  { title: '工厂应付款', value: '¥316,800', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
  { title: '当前库存', value: '18,560件', icon: Package, color: 'text-[#1e3a5f]', bg: 'bg-[#e8eef6]' },
];

const alertCards = [
  { title: '待发货订单', value: '12单', icon: ShoppingCart, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { title: '低库存商品', value: '8款', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
];

const lowStockItems = inventoryRecords.filter(r => r.status === '低库存' || r.status === '缺货');

const topDebtCustomers = [...customers]
  .sort((a, b) => b.shippedDebt - a.shippedDebt)
  .slice(0, 5);

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold text-[#1f2937]">晚上好，Helen</h2>
        <p className="text-sm text-muted-foreground mt-1">这里是今日业务概览。</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statsCards.map((card) => (
          <Card key={card.title} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{card.title}</p>
                  <p className="text-base font-semibold tabular-nums text-[#1f2937]">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {alertCards.map((card) => (
          <Card key={card.title} className={`shadow-sm ${card.border} border`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className={`text-lg font-semibold ${card.color}`}>{card.value}</p>
                  </div>
                </div>
                <Link href={card.title === '待发货订单' ? '/shipping' : '/inventory'}>
                  <Button variant="outline" size="sm">查看详情</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Trend Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">销售趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `¥${(v / 10000).toFixed(0)}万`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="sales" name="销售额" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="cost" name="工厂成本" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="profit" name="销售利润" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders & Debt Ranking */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">最近订单</CardTitle>
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="text-xs">查看全部</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">订单编号</TableHead>
                  <TableHead className="text-xs">客户</TableHead>
                  <TableHead className="text-xs">国家</TableHead>
                  <TableHead className="text-xs text-right">金额</TableHead>
                  <TableHead className="text-xs text-center">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 6).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-xs font-medium">{order.orderNo}</TableCell>
                    <TableCell className="text-xs max-w-[120px] truncate">{order.customerName}</TableCell>
                    <TableCell className="text-xs">{order.country}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Customer Debt Ranking */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">客户欠款排行</CardTitle>
              <Link href="/receivables">
                <Button variant="ghost" size="sm" className="text-xs">查看全部</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">客户名称</TableHead>
                  <TableHead className="text-xs">国家</TableHead>
                  <TableHead className="text-xs text-right">订单应收</TableHead>
                  <TableHead className="text-xs text-right">已发货欠款</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDebtCustomers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs font-medium max-w-[130px] truncate">
                      <Link href={`/customers/${c.id}`} className="hover:text-[#1e3a5f] hover:underline">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">{c.country}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-orange-600">{formatCurrency(c.orderReceivable)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-red-600">{formatCurrency(c.shippedDebt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Alert */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">库存预警</CardTitle>
            <Link href="/inventory">
              <Button variant="ghost" size="sm" className="text-xs">查看全部</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">款号</TableHead>
                <TableHead className="text-xs">商品名称</TableHead>
                <TableHead className="text-xs">颜色</TableHead>
                <TableHead className="text-xs">尺码</TableHead>
                <TableHead className="text-xs">仓库</TableHead>
                <TableHead className="text-xs text-right">可销售库存</TableHead>
                <TableHead className="text-xs text-center">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs font-medium">{item.styleNo}</TableCell>
                  <TableCell className="text-xs">{item.productName}</TableCell>
                  <TableCell className="text-xs">{item.color}</TableCell>
                  <TableCell className="text-xs">{item.size}</TableCell>
                  <TableCell className="text-xs">{item.warehouseName}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums font-medium text-red-600">{item.sellableStock}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(item.status)}`}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
