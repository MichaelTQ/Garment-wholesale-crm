'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency, getStatusColor } from '@/lib/mock-data';
import { useParams, useRouter } from 'next/navigation';
import { useBusinessState } from '@/lib/state/provider';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { products, productionBatches } = useBusinessState();
  const productId = params.id as string;
  const product = products.find(p => p.id === productId);

  if (!product) {
    return <div className="text-center py-12">商品不存在</div>;
  }

  const relatedBatches = productionBatches.filter(b => b.styleNo === product.styleNo);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 返回
        </Button>
        <h2 className="text-lg font-semibold">{product.styleNo} - {product.name}</h2>
        <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${getStatusColor(product.status)}`}>{product.status}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Product Info */}
        <Card className="shadow-sm lg:col-span-1">
          <CardContent className="p-4 space-y-4">
            {/* Image placeholder */}
            <div className="aspect-square rounded-lg bg-[#f5f6fa] flex items-center justify-center text-muted-foreground border">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#1e3a5f]/30">{product.styleNo}</div>
                <div className="text-sm mt-1">{product.name}</div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">款号</span><span className="font-medium">{product.styleNo}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">分类</span><span>{product.category}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">建议销售价</span><span className="font-medium">{formatCurrency(product.suggestedPrice)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">最近工厂成本</span><span>{formatCurrency(product.lastCost)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">上新日期</span><span>{product.newDate}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">当前库存</span><span className="font-medium">{product.currentStock}件</span></div>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-2">颜色</p>
              <div className="flex gap-2">
                {product.colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-[#f5f6fa] rounded px-2 py-1">
                    <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: c.hex }} />
                    <span className="text-xs">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">尺码</p>
              <div className="flex gap-1">
                {product.sizes.map((s, i) => (
                  <span key={i} className="bg-[#f5f6fa] rounded px-2 py-1 text-xs">{s}</span>
                ))}
              </div>
            </div>
            {product.description && (
              <>
                <Separator />
                <p className="text-xs text-muted-foreground">{product.description}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Production Batches */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">历史生产批次</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-xs font-medium text-left p-3">批次编号</th>
                    <th className="text-xs font-medium text-left p-3">工厂</th>
                    <th className="text-xs font-medium text-left p-3">颜色</th>
                    <th className="text-xs font-medium text-left p-3">尺码</th>
                    <th className="text-xs font-medium text-right p-3">数量</th>
                    <th className="text-xs font-medium text-right p-3">单件成本</th>
                    <th className="text-xs font-medium text-right p-3">总成本</th>
                    <th className="text-xs font-medium text-left p-3">入库日期</th>
                    <th className="text-xs font-medium text-center p-3">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedBatches.map(b => (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="text-xs p-3 font-medium">{b.id.toUpperCase()}</td>
                      <td className="text-xs p-3">{b.factoryName}</td>
                      <td className="text-xs p-3">{b.color}</td>
                      <td className="text-xs p-3">{b.size}</td>
                      <td className="text-xs p-3 text-right tabular-nums">{b.quantity}</td>
                      <td className="text-xs p-3 text-right tabular-nums">{formatCurrency(b.unitCost)}</td>
                      <td className="text-xs p-3 text-right tabular-nums">{formatCurrency(b.totalCost)}</td>
                      <td className="text-xs p-3">{b.inboundDate || '-'}</td>
                      <td className="text-xs p-3 text-center">
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(b.status)}`}>{b.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {relatedBatches.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-sm text-muted-foreground py-8">暂无生产批次记录</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
