'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Upload, Eye, Edit, Trash2 } from 'lucide-react';
import { customers, formatCurrency, getStatusColor } from '@/lib/mock-data';
import { toast } from 'sonner';

const countries = [...new Set(customers.map(c => c.country))];
const statusOptions = ['全部', '活跃', '一般', '长期未购买', '有欠款', '有预存款'];

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.whatsapp.includes(search);
    const matchCountry = countryFilter === '全部' || c.country === countryFilter;
    const matchStatus = statusFilter === '全部' || c.status === statusFilter;
    return matchSearch && matchCountry && matchStatus;
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
              <Input
                placeholder="搜索客户名称或WhatsApp..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-8 h-9"
              />
            </div>
            <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-40 h-9"><SelectValue placeholder="按国家筛选" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部国家</SelectItem>
                {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="按状态筛选" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="ml-auto flex gap-2">
              <Button size="sm" className="h-9 bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> 新增客户
              </Button>
              <Button variant="outline" size="sm" className="h-9">
                <Upload className="h-4 w-4 mr-1" /> 批量导入
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
                  <TableHead className="text-xs">客户编号</TableHead>
                  <TableHead className="text-xs">客户名称</TableHead>
                  <TableHead className="text-xs">国家</TableHead>
                  <TableHead className="text-xs">WhatsApp</TableHead>
                  <TableHead className="text-xs">常买品类</TableHead>
                  <TableHead className="text-xs">最近购买</TableHead>
                  <TableHead className="text-xs text-right">累计销售额</TableHead>
                  <TableHead className="text-xs text-right">订单应收</TableHead>
                  <TableHead className="text-xs text-right">已发货欠款</TableHead>
                  <TableHead className="text-xs text-center">状态</TableHead>
                  <TableHead className="text-xs text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs">{c.id.toUpperCase()}</TableCell>
                    <TableCell className="text-xs font-medium">
                      <Link href={`/customers/${c.id}`} className="hover:text-[#1e3a5f] hover:underline">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">{c.country}</TableCell>
                    <TableCell className="text-xs">{c.whatsapp}</TableCell>
                    <TableCell className="text-xs">{c.categories.join('、')}</TableCell>
                    <TableCell className="text-xs">{c.lastPurchaseDate}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{formatCurrency(c.totalSales)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-orange-600">{formatCurrency(c.orderReceivable)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-red-600">{formatCurrency(c.shippedDebt)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(c.status)}`}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/customers/${c.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => toast.error('确认删除该客户吗？')}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-muted-foreground">共 {filtered.length} 条记录</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>上一页</Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button key={i} variant={currentPage === i + 1 ? 'default' : 'outline'} size="sm" className="h-7 w-7 text-xs p-0" onClick={() => setCurrentPage(i + 1)}>
                  {i + 1}
                </Button>
              ))}
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>下一页</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增客户</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>客户名称 *</Label>
                <Input placeholder="请输入客户名称" />
              </div>
              <div className="space-y-2">
                <Label>国家 *</Label>
                <Select><SelectTrigger><SelectValue placeholder="选择国家" /></SelectTrigger>
                  <SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>城市</Label>
                <Input placeholder="请输入城市" />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp号码 *</Label>
                <Input placeholder="请输入WhatsApp号码" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>常买品类</Label>
              <Input placeholder="如：牛仔裤、T恤" />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <textarea className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm" rows={3} placeholder="客户备注..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={() => { setShowAddDialog(false); toast.success('客户创建成功'); }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
