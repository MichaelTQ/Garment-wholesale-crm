'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer, Download, Share2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { orders, customers, formatCurrency } from '@/lib/mock-data';
import { toast } from 'sonner';

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return <div className="text-center py-12">订单不存在</div>;
  }

  const customer = customers.find(c => c.id === order.customerId);
  const receiptNo = `RCT-${order.orderNo.replace('ORD-', '')}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> 返回订单
          </Button>
          <h2 className="text-lg font-semibold">Receipt</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success('打印功能开发中')}>
            <Printer className="h-4 w-4 mr-1" /> 打印
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success('PDF下载功能开发中')}>
            <Download className="h-4 w-4 mr-1" /> 下载PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success('分享功能开发中')}>
            <Share2 className="h-4 w-4 mr-1" /> 分享
          </Button>
        </div>
      </div>

      <Card className="shadow-sm max-w-3xl mx-auto">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#1e3a5f]">Helen服装批发</h1>
              <p className="text-xs text-muted-foreground mt-1">Wholesale Fashion Business</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">RECEIPT</p>
              <p className="text-xs text-muted-foreground">{receiptNo}</p>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Seller</p>
              <p className="text-sm font-medium">Helen服装批发</p>
              <p className="text-xs text-muted-foreground">Guangzhou, China</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Customer</p>
              <p className="text-sm font-medium">{customer?.name || '-'}</p>
              <p className="text-xs text-muted-foreground">{customer?.country || '-'}</p>
              <p className="text-xs text-muted-foreground">{customer?.whatsapp || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Receipt Number</p>
              <p className="font-medium">{receiptNo}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Order Number</p>
              <p className="font-medium">{order.orderNo}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{order.orderDate}</p>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Items */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b">
                <th className="text-xs font-medium text-left pb-2">款号</th>
                <th className="text-xs font-medium text-left pb-2">商品</th>
                <th className="text-xs font-medium text-left pb-2">颜色</th>
                <th className="text-xs font-medium text-left pb-2">尺码</th>
                <th className="text-xs font-medium text-right pb-2">数量</th>
                <th className="text-xs font-medium text-right pb-2">单价</th>
                <th className="text-xs font-medium text-right pb-2">小计</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="text-xs py-2">{item.styleNo}</td>
                  <td className="text-xs py-2">{item.productName}</td>
                  <td className="text-xs py-2">{item.color}</td>
                  <td className="text-xs py-2">{item.size}</td>
                  <td className="text-xs py-2 text-right tabular-nums">{item.quantity}</td>
                  <td className="text-xs py-2 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-xs py-2 text-right tabular-nums font-medium">{formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Separator className="mb-4" />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-semibold tabular-nums">{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="text-green-600 tabular-nums">{formatCurrency(order.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance Due</span>
                <span className="text-red-600 font-semibold tabular-nums">{formatCurrency(order.totalAmount - order.paidAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span>银行转账</span>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mt-8 pt-4 border-t">
            <p className="text-xs text-muted-foreground">Note:</p>
            <p className="text-xs text-muted-foreground">Thank you for your business. Please arrange payment according to the agreed terms.</p>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[10px] text-muted-foreground">Helen服装批发 | Guangzhou, China | WhatsApp: +86 138 0013 8000</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
