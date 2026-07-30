'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Filter, Check, SkipForward, ExternalLink } from 'lucide-react';
import { getStatusColor } from '@/lib/mock-data';
import { toast } from 'sonner';
import { useBusinessState } from '@/lib/state/provider';

type Step = 1 | 2 | 3 | 4;

export default function NewArrivalPage() {
  const { products, customers } = useBusinessState();
  const [step, setStep] = useState<Step>(1);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState('全部');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [debtFilter, setDebtFilter] = useState('全部');
  const [activeFilter, setActiveFilter] = useState('全部');
  const [message, setMessage] = useState(
    `Hello, we have a new style available. The design is suitable for wholesale orders. Please let me know if you would like to see more photos, sizes and prices.`
  );
  const [sendStatuses, setSendStatuses] = useState<Record<string, string>>({});

  const newArrivalProducts = products.filter(p => ['已上新', '正常销售'].includes(p.status));
  const categories = [...new Set(products.map(p => p.category))];
  const countries = [...new Set(customers.map(c => c.country))];

  const filteredCustomers = customers.filter(c => {
    const matchCountry = countryFilter === '全部' || c.country === countryFilter;
    const matchCategory = categoryFilter === '全部' || c.frequentCategories.includes(categoryFilter);
    const matchDebt = debtFilter === '全部' || (debtFilter === '有欠款' ? c.shippedDebt > 0 : c.shippedDebt === 0);
    const matchActive = activeFilter === '全部' || c.status === activeFilter;
    return matchCountry && matchCategory && matchDebt && matchActive;
  });

  const steps = [
    { num: 1, label: '选择新款' },
    { num: 2, label: '筛选客户' },
    { num: 3, label: '生成文案' },
    { num: 4, label: '发送列表' },
  ];

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleMarkSent = (customerId: string) => {
    setSendStatuses(prev => ({ ...prev, [customerId]: '已发送' }));
    toast.success('已标记为已发送');
  };

  const handleSkip = (customerId: string) => {
    setSendStatuses(prev => ({ ...prev, [customerId]: '暂不发送' }));
  };

  const handleOpenWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Steps indicator */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <button
                  onClick={() => setStep(s.num as Step)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    step >= s.num ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-muted-foreground'
                  }`}
                >
                  <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] border border-current">{s.num}</span>
                  {s.label}
                </button>
                {i < steps.length - 1 && <div className="w-8 h-px bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select Products */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">选择要上新的商品（已选 {selectedProducts.length} 款）</p>
            <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" disabled={selectedProducts.length === 0} onClick={() => setStep(2)}>
              下一步
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {newArrivalProducts.map(p => (
              <Card
                key={p.id}
                className={`shadow-sm cursor-pointer transition-all ${selectedProducts.includes(p.id) ? 'ring-2 ring-[#1e3a5f]' : 'hover:shadow-md'}`}
                onClick={() => toggleProduct(p.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={selectedProducts.includes(p.id)} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="h-16 w-full rounded bg-[#f5f6fa] flex items-center justify-center text-xs text-muted-foreground mb-2 border">
                        {p.styleNo}
                      </div>
                      <p className="text-xs font-medium truncate">{p.styleNo} - {p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.category}</p>
                      <div className="flex gap-1 mt-1">
                        {p.colors.slice(0, 3).map((c, i) => (
                          <span key={i} className="h-2.5 w-2.5 rounded-full border" style={{ backgroundColor: c.hex }} title={c.name} />
                        ))}
                      </div>
                      <p className="text-xs font-medium mt-1">¥{p.suggestedPrice}/件</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Filter Customers */}
      {step === 2 && (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">筛选条件</span>
                </div>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-32 h-9"><SelectValue placeholder="国家" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">全部国家</SelectItem>
                    {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-32 h-9"><SelectValue placeholder="品类" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">全部分类</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={debtFilter} onValueChange={setDebtFilter}>
                  <SelectTrigger className="w-32 h-9"><SelectValue placeholder="欠款" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">不限</SelectItem>
                    <SelectItem value="有欠款">有欠款</SelectItem>
                    <SelectItem value="无欠款">无欠款</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger className="w-32 h-9"><SelectValue placeholder="活跃度" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">不限</SelectItem>
                    <SelectItem value="活跃">活跃</SelectItem>
                    <SelectItem value="一般">一般</SelectItem>
                    <SelectItem value="长期未购买">长期未购买</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">符合条件的客户：<span className="font-medium text-foreground">{filteredCustomers.length}</span> 位</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>上一步</Button>
              <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" disabled={filteredCustomers.length === 0} onClick={() => setStep(3)}>
                下一步
              </Button>
            </div>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-xs font-medium text-left p-3">客户名称</th>
                    <th className="text-xs font-medium text-left p-3">国家</th>
                    <th className="text-xs font-medium text-left p-3">WhatsApp</th>
                    <th className="text-xs font-medium text-left p-3">常买品类</th>
                    <th className="text-xs font-medium text-right p-3">累计销售额</th>
                    <th className="text-xs font-medium text-center p-3">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.slice(0, 15).map(c => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="text-xs p-3 font-medium">{c.name}</td>
                      <td className="text-xs p-3">{c.country}</td>
                      <td className="text-xs p-3">{c.whatsapp}</td>
                      <td className="text-xs p-3">{c.frequentCategories.join(', ')}</td>
                      <td className="text-xs p-3 text-right tabular-nums">¥{c.totalSales.toLocaleString()}</td>
                      <td className="text-xs p-3 text-center">
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(c.status)}`}>{c.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Generate Message */}
      {step === 3 && (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">生成上新文案</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">已选商品：</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map(id => {
                    const p = products.find(pp => pp.id === id);
                    return p ? (
                      <Badge key={id} variant="secondary" className="text-xs">{p.styleNo} - {p.name}</Badge>
                    ) : null;
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">目标客户：{filteredCustomers.length} 位</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>WhatsApp 上新文案（英文）</Label>
                <Textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={6}
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground">您可以手动编辑文案内容，发送时将使用编辑后的版本。</p>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setStep(2)}>上一步</Button>
            <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={() => setStep(4)}>
              生成发送列表
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Send List */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">共 {filteredCustomers.length} 位客户待发送</p>
            <Button variant="outline" size="sm" onClick={() => setStep(3)}>上一步</Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-xs font-medium text-left p-3">客户名称</th>
                    <th className="text-xs font-medium text-left p-3">国家</th>
                    <th className="text-xs font-medium text-left p-3">WhatsApp</th>
                    <th className="text-xs font-medium text-left p-3">最近购买</th>
                    <th className="text-xs font-medium text-center p-3">发送状态</th>
                    <th className="text-xs font-medium text-center p-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(c => {
                    const status = sendStatuses[c.id] || '未发送';
                    return (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="text-xs p-3 font-medium">{c.name}</td>
                        <td className="text-xs p-3">{c.country}</td>
                        <td className="text-xs p-3">{c.whatsapp}</td>
                        <td className="text-xs p-3">{c.lastPurchaseDate}</td>
                        <td className="text-xs p-3 text-center">
                          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${
                            status === '已发送' ? 'bg-green-50 text-green-700' :
                            status === '暂不发送' ? 'bg-gray-100 text-gray-500' :
                            'bg-yellow-50 text-yellow-700'
                          }`}>{status}</Badge>
                        </td>
                        <td className="text-xs p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600" onClick={() => handleOpenWhatsApp(c.whatsapp)}>
                              <ExternalLink className="h-3 w-3 mr-0.5" /> WhatsApp
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleMarkSent(c.id)}>
                              <Check className="h-3 w-3 mr-0.5" /> 已发送
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => handleSkip(c.id)}>
                              <SkipForward className="h-3 w-3 mr-0.5" /> 跳过
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
