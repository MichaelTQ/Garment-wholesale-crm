'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Eye, Receipt } from 'lucide-react';
import { formatCurrency, getStatusColor } from '@/lib/mock-data';
import { toast } from 'sonner';
import { useBusinessState } from '@/lib/state/provider';

const orderStatuses = ['全部', '草稿', '待确认', '已确认', '部分发货', '已全部发货', '已完成', '已取消'];

export default function OrdersPage() {
  const { orders, customers, confirmOrder, cancelOrder } = useBusinessState();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [customerFilter, setCustomerFilter] = useState('全部');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.orderNo.toLowerCase().includes(search.toLowerCase()) || o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '全部' || o.status === statusFilter;
    const matchCustomer = customerFilter === '全部' || o.customerId === customerFilter;
    return matchSearch && matchStatus && matchCustomer;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索订单编号或客户..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-8 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="订单状态" /></SelectTrigger>
              <SelectContent>
                {orderStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={customerFilter} onValueChange={(v) => { setCustomerFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-48 h-9"><SelectValue placeholder="按客户筛选" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部客户</SelectItem>
                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="ml-auto">
              <Link href="/orders/new">
                <Button size="sm" className="h-9 bg-[#1e3a5f] hover:bg-[#2d5a8e]">
                  <Plus className="h-4 w-4 mr-1" /> 新建订单
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">订单编号</TableHead>
                  <TableHead className="text-xs">客户</TableHead>
                  <TableHead className="text-xs">国家</TableHead>
                  <TableHead className="text-xs">下单日期</TableHead>
                  <TableHead className="text-xs text-right">订单金额</TableHead>
                  <TableHead className="text-xs text-right">已收金额</TableHead>
                  <TableHead className="text-xs text-right">未收金额</TableHead>
                  <TableHead className="text-xs text-right">订单件数</TableHead>
                  <TableHead className="text-xs text-right">已发货</TableHead>
                  <TableHead className="text-xs text-right">待发货</TableHead>
                  <TableHead className="text-xs text-center">状态</TableHead>
                  <TableHead className="text-xs text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="text-xs font-medium">{o.orderNo}</TableCell>
                    <TableCell className="text-xs max-w-[120px] truncate">
                      <Link href={`/customers/${o.customerId}`} className="hover:text-[#1e3a5f] hover:underline">{o.customerName}</Link>
                    </TableCell>
                    <TableCell className="text-xs">{o.country}</TableCell>
                    <TableCell className="text-xs">{o.orderDate}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{formatCurrency(o.totalAmount)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-green-600">{formatCurrency(o.paidAmount)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-orange-600">{formatCurrency(o.unpaidAmount)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{o.totalQuantity}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{o.shippedQuantity}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{o.pendingShipQuantity}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(o.status)}`}>{o.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                        <Link href={`/orders/${o.id}/receipt`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Receipt className="h-3.5 w-3.5" /></Button>
                        </Link>
                        {o.status === '草稿' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              const result = confirmOrder(o.id);
                              if (!result.ok) {
                                toast.error(result.error);
                                return;
                              }
                              toast.success('订单已确认，库存预留已生效');
                            }}
                          >
                            确认
                          </Button>
                        )}
                        {['草稿', '已确认'].includes(o.status) && o.shippedQuantity === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-red-600"
                            onClick={() => {
                              const result = cancelOrder(o.id);
                              if (!result.ok) {
                                toast.error(result.error);
                                return;
                              }
                              toast.success('订单已取消，未发货预留库存已释放');
                            }}
                          >
                            取消
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center text-sm text-muted-foreground">
                      暂无订单，请先完成客户和商品入库，再创建订单
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-muted-foreground">共 {filtered.length} 条记录</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>上一页</Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button key={i} variant={currentPage === i + 1 ? 'default' : 'outline'} size="sm" className="h-7 w-7 text-xs p-0" onClick={() => setCurrentPage(i + 1)}>{i + 1}</Button>
              ))}
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>下一页</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
