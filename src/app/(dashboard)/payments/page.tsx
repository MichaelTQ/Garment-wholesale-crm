'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Upload } from 'lucide-react';
import { payments, customers, orders, formatCurrency } from '@/lib/mock-data';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('全部');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filtered = payments.filter(p => {
    const matchSearch = !search || p.customerName.toLowerCase().includes(search.toLowerCase()) || p.paymentNo.toLowerCase().includes(search.toLowerCase());
    const matchMethod = methodFilter === '全部' || p.method === methodFilter;
    return matchSearch && matchMethod;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerOrders = orders.filter(o => o.customerId === selectedCustomerId && o.unpaidAmount > 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索客户或收款编号..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-8 h-9" />
            </div>
            <Select value={methodFilter} onValueChange={v => { setMethodFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-32 h-9"><SelectValue placeholder="付款方式" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部方式</SelectItem>
                <SelectItem value="银行转账">银行转账</SelectItem>
                <SelectItem value="微信">微信</SelectItem>
                <SelectItem value="支付宝">支付宝</SelectItem>
                <SelectItem value="现金">现金</SelectItem>
                <SelectItem value="其他">其他</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto">
              <Button size="sm" className="h-9 bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> 新增收款
              </Button>
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
                  <TableHead className="text-xs">收款编号</TableHead>
                  <TableHead className="text-xs">客户</TableHead>
                  <TableHead className="text-xs">收款日期</TableHead>
                  <TableHead className="text-xs text-right">收款金额</TableHead>
                  <TableHead className="text-xs">付款方式</TableHead>
                  <TableHead className="text-xs">关联订单</TableHead>
                  <TableHead className="text-xs">备注</TableHead>
                  <TableHead className="text-xs text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs font-medium">{p.paymentNo}</TableCell>
                    <TableCell className="text-xs">
                      <Link href={`/customers/${p.customerId}`} className="hover:text-[#1e3a5f] hover:underline">{p.customerName}</Link>
                    </TableCell>
                    <TableCell className="text-xs">{p.paymentDate}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-green-600 font-medium">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-xs">{p.method}</TableCell>
                    <TableCell className="text-xs">{p.relatedOrderNo}</TableCell>
                    <TableCell className="text-xs max-w-[120px] truncate">{p.notes}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">详情</Button>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Add Payment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增收款</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>选择客户 *</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger><SelectValue placeholder="请选择客户" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedCustomer && (
              <div className="grid grid-cols-3 gap-4 bg-[#f5f6fa] p-3 rounded-lg text-sm">
                <div><span className="text-muted-foreground">订单应收：</span><span className="font-medium text-orange-600">{formatCurrency(selectedCustomer.orderReceivable)}</span></div>
                <div><span className="text-muted-foreground">已发货欠款：</span><span className="font-medium text-red-600">{formatCurrency(selectedCustomer.shippedDebt)}</span></div>
                <div><span className="text-muted-foreground">预存余额：</span><span className="font-medium text-blue-600">{formatCurrency(selectedCustomer.presaveBalance)}</span></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>收款日期 *</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>收款金额 *</Label>
                <Input type="number" placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>付款方式 *</Label>
                <Select><SelectTrigger><SelectValue placeholder="选择付款方式" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="银行转账">银行转账</SelectItem>
                    <SelectItem value="微信">微信</SelectItem>
                    <SelectItem value="支付宝">支付宝</SelectItem>
                    <SelectItem value="现金">现金</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>关联订单</Label>
                <Select><SelectTrigger><SelectValue placeholder="选择关联订单" /></SelectTrigger>
                  <SelectContent>
                    {customerOrders.map(o => <SelectItem key={o.id} value={o.id}>{o.orderNo} - {formatCurrency(o.unpaidAmount)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>收款凭证</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> 上传凭证</Button>
                <span className="text-xs text-muted-foreground">支持 JPG/PNG 格式</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <textarea className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm" rows={2} placeholder="收款备注..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={() => {
              setShowAddDialog(false);
              toast.success('收款登记成功');
            }}>确认收款</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
