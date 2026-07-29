'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Eye } from 'lucide-react';
import { customers, formatCurrency } from '@/lib/mock-data';

export default function ReceivablesPage() {
  const [search, setSearch] = useState('');

  const totalOrderReceivable = customers.reduce((s, c) => s + c.orderReceivable, 0);
  const totalShippedDebt = customers.reduce((s, c) => s + c.shippedDebt, 0);
  const totalPreDeposit = customers.reduce((s, c) => s + c.preDeposit, 0);

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.country.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (c.orderReceivable > 0 || c.shippedDebt > 0 || c.preDeposit > 0);
  }).sort((a, b) => b.shippedDebt - a.shippedDebt);

  const getDebtColor = (amount: number) => {
    if (amount > 100000) return 'text-red-600';
    if (amount > 50000) return 'text-orange-600';
    if (amount > 0) return 'text-[#1e3a5f]';
    return 'text-green-600';
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">客户订单应收总额</p>
            <p className="text-lg font-semibold tabular-nums text-orange-600">{formatCurrency(totalOrderReceivable)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">已发货实际欠款</p>
            <p className="text-lg font-semibold tabular-nums text-red-600">{formatCurrency(totalShippedDebt)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">客户预存余额</p>
            <p className="text-lg font-semibold tabular-nums text-blue-600">{formatCurrency(totalPreDeposit)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索客户名称或国家..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
            <Button variant="outline" size="sm" className="h-9" onClick={() => alert('导出功能开发中')}>
              <Download className="h-4 w-4 mr-1" /> 导出
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Receivables Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">客户名称</TableHead>
                  <TableHead className="text-xs">国家</TableHead>
                  <TableHead className="text-xs text-right">订单应收金额</TableHead>
                  <TableHead className="text-xs text-right">待发货件数</TableHead>
                  <TableHead className="text-xs text-right">已发货实际欠款</TableHead>
                  <TableHead className="text-xs text-right">客户预存余额</TableHead>
                  <TableHead className="text-xs">最近收款日期</TableHead>
                  <TableHead className="text-xs">备注</TableHead>
                  <TableHead className="text-xs text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs font-medium">
                      <Link href={`/customers/${c.id}`} className="text-[#1e3a5f] hover:underline">{c.name}</Link>
                    </TableCell>
                    <TableCell className="text-xs">{c.country}</TableCell>
                    <TableCell className={`text-xs text-right tabular-nums font-medium ${getDebtColor(c.orderReceivable)}`}>
                      {formatCurrency(c.orderReceivable)}
                    </TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{c.pendingShipQty}</TableCell>
                    <TableCell className={`text-xs text-right tabular-nums font-medium ${getDebtColor(c.shippedDebt)}`}>
                      {c.shippedDebt > 0 ? formatCurrency(c.shippedDebt) : <span className="text-green-600">¥0</span>}
                    </TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-blue-600">
                      {c.preDeposit > 0 ? formatCurrency(c.preDeposit) : '-'}
                    </TableCell>
                    <TableCell className="text-xs">{c.lastPaymentDate || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {c.shippedDebt > 100000 && <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-700">严重欠款</Badge>}
                      {c.shippedDebt > 0 && c.shippedDebt <= 100000 && <Badge variant="secondary" className="text-[10px] bg-orange-50 text-orange-700">有欠款</Badge>}
                      {c.shippedDebt === 0 && c.orderReceivable === 0 && <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700">已结清</Badge>}
                      {c.preDeposit > 0 && <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700">有预存</Badge>}
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={`/customers/${c.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs"><Eye className="h-3 w-3 mr-1" />详情</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
