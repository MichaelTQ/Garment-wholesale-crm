'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, type Payment } from '@/lib/mock-data';
import { useBusinessState } from '@/lib/state/provider';

const paymentMethods: Payment['method'][] = ['银行转账', '微信', '支付宝', '现金', '其他'];
type EntryType = 'cash' | 'deposit';

export default function PaymentsPage() {
  const {
    payments,
    depositApplications,
    customers,
    orders,
    createPayment,
    applyDeposit,
  } = useBusinessState();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('全部');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<Payment['method']>('银行转账');
  const [relatedOrderId, setRelatedOrderId] = useState('auto');
  const [voucher, setVoucher] = useState('');
  const [notes, setNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPaymentDate(new Date().toISOString().slice(0, 10));
  }, []);

  const filtered = payments.filter((payment) => {
    const matchSearch =
      !search ||
      payment.customerName.toLowerCase().includes(search.toLowerCase()) ||
      payment.paymentNo.toLowerCase().includes(search.toLowerCase());
    const matchMethod = methodFilter === '全部' || payment.method === methodFilter;
    return matchSearch && matchMethod;
  });
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
  const customerOrders = orders.filter(
    (order) =>
      order.customerId === selectedCustomerId &&
      !['草稿', '待确认', '已取消'].includes(order.status) &&
      order.unpaidAmount > 0,
  );
  const customerUnpaid = customerOrders.reduce((sum, order) => sum + order.unpaidAmount, 0);
  const expectedDeposit = Math.max(0, amount - customerUnpaid);
  const selectedOrder = customerOrders.find((order) => order.id === relatedOrderId);

  const resetForm = () => {
    setSelectedCustomerId('');
    setEntryType('cash');
    setAmount(0);
    setMethod('银行转账');
    setRelatedOrderId('auto');
    setVoucher('');
    setNotes('');
  };

  const submitPayment = () => {
    if (entryType === 'deposit') {
      const result = applyDeposit({
        customerId: selectedCustomerId,
        orderId: relatedOrderId,
        applicationDate: paymentDate,
        amount,
        notes,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setShowAddDialog(false);
      resetForm();
      toast.success('预存款抵扣成功，客户余额和订单欠款已同步更新');
      return;
    }

    const result = createPayment({
      customerId: selectedCustomerId,
      paymentDate,
      amount,
      method,
      relatedOrderId: relatedOrderId === 'auto' ? '' : relatedOrderId,
      voucher,
      notes,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setShowAddDialog(false);
    resetForm();
    toast.success(
      expectedDeposit > 0
        ? `收款成功，超出订单未收的 ${formatCurrency(expectedDeposit)} 已转为客户预存款`
        : '收款成功，订单未收金额已同步更新',
    );
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索客户或收款编号..." value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} className="h-9 pl-8" />
            </div>
            <Select value={methodFilter} onValueChange={(value) => { setMethodFilter(value); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 w-32"><SelectValue placeholder="付款方式" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部方式</SelectItem>
                {paymentMethods.map((entry) => <SelectItem key={entry} value={entry}>{entry}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="ml-auto h-9 bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-1 h-4 w-4" /> 新增收款
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">收款编号</TableHead>
                <TableHead className="text-xs">客户</TableHead>
                <TableHead className="text-xs">收款日期</TableHead>
                <TableHead className="text-right text-xs">收款金额</TableHead>
                <TableHead className="text-right text-xs">核销订单</TableHead>
                <TableHead className="text-right text-xs">转预存款</TableHead>
                <TableHead className="text-xs">付款方式</TableHead>
                <TableHead className="text-xs">优先关联</TableHead>
                <TableHead className="text-xs">备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-xs font-medium">{payment.paymentNo}</TableCell>
                  <TableCell className="text-xs">
                    <Link href={`/customers/${payment.customerId}`} className="hover:text-[#1e3a5f] hover:underline">{payment.customerName}</Link>
                  </TableCell>
                  <TableCell className="text-xs">{payment.paymentDate}</TableCell>
                  <TableCell className="text-right text-xs font-medium tabular-nums text-green-600">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{formatCurrency(payment.allocatedAmount)}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-blue-600">{formatCurrency(payment.depositAmount)}</TableCell>
                  <TableCell className="text-xs">{payment.method}</TableCell>
                  <TableCell className="text-xs">{payment.relatedOrderNo || '-'}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-xs">{payment.notes || '-'}</TableCell>
                </TableRow>
              ))}
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-sm text-muted-foreground">暂无收款记录</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-muted-foreground">共 {filtered.length} 条记录</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)}>上一页</Button>
              {Array.from({ length: totalPages }, (_, index) => (
                <Button key={index} variant={currentPage === index + 1 ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0 text-xs" onClick={() => setCurrentPage(index + 1)}>{index + 1}</Button>
              ))}
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)}>下一页</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="border-b p-4">
            <h3 className="font-medium">预存款抵扣记录</h3>
            <p className="mt-1 text-xs text-muted-foreground">抵扣不是新的现金收款，因此单独记录</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">抵扣编号</TableHead>
                <TableHead className="text-xs">客户</TableHead>
                <TableHead className="text-xs">抵扣日期</TableHead>
                <TableHead className="text-xs">对应订单</TableHead>
                <TableHead className="text-right text-xs">抵扣金额</TableHead>
                <TableHead className="text-xs">备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depositApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="text-xs font-medium">{application.applicationNo}</TableCell>
                  <TableCell className="text-xs">
                    <Link href={`/customers/${application.customerId}`} className="hover:underline">{application.customerName}</Link>
                  </TableCell>
                  <TableCell className="text-xs">{application.applicationDate}</TableCell>
                  <TableCell className="text-xs">{application.orderNo}</TableCell>
                  <TableCell className="text-right text-xs font-medium tabular-nums text-blue-600">{formatCurrency(application.amount)}</TableCell>
                  <TableCell className="text-xs">{application.notes || '-'}</TableCell>
                </TableRow>
              ))}
              {depositApplications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-sm text-muted-foreground">暂无预存款抵扣记录</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>新增收款</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>业务类型 *</Label>
              <Select
                value={entryType}
                onValueChange={(value: EntryType) => {
                  setEntryType(value);
                  setAmount(0);
                  setRelatedOrderId(value === 'cash' ? 'auto' : '');
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">新增现金收款</SelectItem>
                  <SelectItem value="deposit">使用预存款抵扣订单</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>选择客户 *</Label>
              <Select value={selectedCustomerId} onValueChange={(value) => {
                setSelectedCustomerId(value);
                setRelatedOrderId(entryType === 'cash' ? 'auto' : '');
                setAmount(0);
              }}>
                <SelectTrigger><SelectValue placeholder="请选择客户" /></SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedCustomer && (
              <div className="grid grid-cols-3 gap-4 rounded-lg bg-[#f5f6fa] p-3 text-sm">
                <div><span className="text-muted-foreground">订单应收：</span><span className="font-medium text-orange-600">{formatCurrency(selectedCustomer.orderReceivable)}</span></div>
                <div><span className="text-muted-foreground">已发货欠款：</span><span className="font-medium text-red-600">{formatCurrency(selectedCustomer.shippedDebt)}</span></div>
                <div><span className="text-muted-foreground">预存余额：</span><span className="font-medium text-blue-600">{formatCurrency(selectedCustomer.presaveBalance)}</span></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{entryType === 'deposit' ? '抵扣日期' : '收款日期'} *</Label>
                <Input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{entryType === 'deposit' ? '抵扣金额' : '收款金额'} *</Label>
                <Input
                  type="number"
                  min={0}
                  max={entryType === 'deposit' ? Math.min(selectedCustomer?.presaveBalance ?? 0, selectedOrder?.unpaidAmount ?? Number.POSITIVE_INFINITY) : undefined}
                  step="0.01"
                  value={amount || ''}
                  onChange={(event) => setAmount(Number(event.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {entryType === 'cash' && (
                <div className="space-y-2">
                  <Label>付款方式 *</Label>
                  <Select value={method} onValueChange={(value: Payment['method']) => setMethod(value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((entry) => <SelectItem key={entry} value={entry}>{entry}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>{entryType === 'deposit' ? '抵扣订单 *' : '优先核销订单'}</Label>
                <Select
                  value={relatedOrderId}
                  onValueChange={(value) => {
                    setRelatedOrderId(value);
                    if (entryType === 'deposit') {
                      const order = customerOrders.find((item) => item.id === value);
                      setAmount(Math.min(selectedCustomer?.presaveBalance ?? 0, order?.unpaidAmount ?? 0));
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder={entryType === 'deposit' ? '请选择欠款订单' : undefined} /></SelectTrigger>
                  <SelectContent>
                    {entryType === 'cash' && <SelectItem value="auto">自动按最早未收订单核销</SelectItem>}
                    {customerOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>{order.orderNo} - {formatCurrency(order.unpaidAmount)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {amount > 0 && entryType === 'cash' && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
                预计核销 {formatCurrency(Math.min(amount, customerUnpaid))}；
                {expectedDeposit > 0 ? `超出的 ${formatCurrency(expectedDeposit)} 将自动成为客户预存款。` : '不会产生新增预存款。'}
              </div>
            )}
            {entryType === 'deposit' && selectedOrder && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
                将使用 {formatCurrency(amount)} 预存款抵扣 {selectedOrder.orderNo}；
                抵扣后预计剩余欠款 {formatCurrency(Math.max(0, selectedOrder.unpaidAmount - amount))}，
                客户剩余预存款 {formatCurrency(Math.max(0, (selectedCustomer?.presaveBalance ?? 0) - amount))}。
              </div>
            )}
            {entryType === 'cash' && (
              <div className="space-y-2">
                <Label>凭证编号或图片地址</Label>
                <Input value={voucher} onChange={(event) => setVoucher(event.target.value)} placeholder="可选" />
              </div>
            )}
            <div className="space-y-2">
              <Label>备注</Label>
              <textarea className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={submitPayment}>
              {entryType === 'deposit' ? '确认抵扣' : '确认收款'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
