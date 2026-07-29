'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const importTypes = [
  { id: 'customers', label: '客户资料', icon: '👤' },
  { id: 'products', label: '商品资料', icon: '📦' },
  { id: 'receivables', label: '客户应收汇总', icon: '💰' },
  { id: 'orders', label: '历史订单', icon: '📋' },
  { id: 'payments', label: '收款记录', icon: '💳' },
  { id: 'factories', label: '工厂资料', icon: '🏭' },
  { id: 'inventory', label: '库存数据', icon: '📊' },
];

const mockPreviewData: Record<string, string[][]> = {
  customers: [
    ['客户名称', '国家', 'WhatsApp', '常买品类'],
    ['ABC Trading Co.', 'Nigeria', '+234 8012345678', '牛仔裤,连衣裙'],
    ['Lagos Fashion Hub', 'Nigeria', '+234 8098765432', 'T恤,短裤'],
    ['Accra Styles Ltd', 'Ghana', '+233 201234567', '连衣裙,半身裙'],
    ['Nairobi Textiles', 'Kenya', '+254 712345678', '牛仔裤,外套'],
    ['Dar Styles Co.', 'Tanzania', '+255 713456789', 'T恤,连衣裙'],
    ['Kampala Wear', 'Uganda', '+256 771234567', '短裤,运动服'],
    ['Douala Fashion', 'Cameroon', '+237 671234567', '连衣裙,半身裙'],
    ['Dakar Styles', 'Senegal', '+221 771234567', '牛仔裤,T恤'],
    ['Cape Wear Ltd', 'South Africa', '+27 821234567', '外套,连衣裙'],
    ['Abidjan Fashion', 'Côte d\'Ivoire', '+225 071234567', 'T恤,短裤'],
  ],
  products: [
    ['款号', '商品名称', '分类', '颜色', '尺码'],
    ['HJ-001', '经典直筒牛仔裤', '牛仔裤', '深蓝', 'S,M,L,XL,XXL'],
    ['HJ-002', '修身显瘦牛仔裤', '牛仔裤', '黑色', 'S,M,L,XL'],
    ['HL-001', '碎花雪纺连衣裙', '连衣裙', '红色', 'S,M,L'],
    ['HT-001', '纯棉圆领T恤', 'T恤', '白色', 'S,M,L,XL,XXL'],
    ['HD-001', '高腰A字半身裙', '半身裙', '卡其色', 'S,M,L,XL'],
  ],
  inventory: [
    ['款号', '颜色', '尺码', '仓库', '数量'],
    ['HJ-001', '深蓝', 'M', '广州白云仓', '580'],
    ['HJ-001', '深蓝', 'L', '广州白云仓', '420'],
    ['HJ-002', '黑色', 'S', '广州白云仓', '310'],
    ['HL-001', '红色', 'M', '佛山南海仓', '260'],
    ['HT-001', '白色', 'L', '广州白云仓', '490'],
    ['HT-001', '白色', 'XL', '广州白云仓', '380'],
    ['HD-001', '卡其色', 'S', '东莞虎门仓', '220'],
  ],
};

const mockErrors = [
  { row: 3, field: 'WhatsApp', message: 'WhatsApp号码格式错误' },
  { row: 7, field: '金额', message: '金额为空' },
  { row: 12, field: '客户名称', message: '客户名称重复' },
  { row: 15, field: '日期', message: '日期格式错误' },
];

export default function DataImportPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [importComplete, setImportComplete] = useState(false);

  const handleUpload = () => {
    setUploadedFile('客户资料_20250615.xlsx');
    setShowPreview(true);
  };

  const handleConfirmImport = () => {
    setImportComplete(true);
    toast.success('数据导入成功！已导入 18 条记录。');
  };

  const handleReset = () => {
    setSelectedType(null);
    setUploadedFile(null);
    setShowPreview(false);
    setShowMapping(false);
    setShowConfirm(false);
    setImportComplete(false);
  };

  const previewData = selectedType ? (mockPreviewData[selectedType] || mockPreviewData.customers) : [];

  return (
    <div className="space-y-4">
      <Tabs defaultValue="import">
        <TabsList className="bg-white">
          <TabsTrigger value="import">数据导入</TabsTrigger>
          <TabsTrigger value="history">导入历史</TabsTrigger>
          <TabsTrigger value="template">下载模板</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-4">
          {!importComplete ? (
            <div className="space-y-4">
              {/* Step 1: Select Import Type */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">1. 选择导入类型</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {importTypes.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setSelectedType(t.id); setUploadedFile(null); setShowPreview(false); setShowMapping(false); setShowConfirm(false); }}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-all ${
                          selectedType === t.id ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 ring-1 ring-[#1e3a5f]' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg">{t.icon}</span>
                        <span className="font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Upload File */}
              {selectedType && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">2. 上传文件</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">拖拽文件到此处，或点击选择文件</p>
                      <p className="text-xs text-muted-foreground mb-4">支持 .xlsx, .xls, .csv 格式，最大 10MB</p>
                      <div className="flex items-center justify-center gap-3">
                        <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={handleUpload}>
                          <Upload className="h-4 w-4 mr-1" /> 选择文件
                        </Button>
                        {uploadedFile && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{uploadedFile}</span>
                            <span className="text-xs text-muted-foreground">(24.5 KB)</span>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Preview */}
              {showPreview && previewData.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">3. 数据预览（前10行）</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setShowMapping(true)}>
                        下一步：字段映射 <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-[#f5f6fa]">
                            {previewData[0]?.map((h, i) => (
                              <th key={i} className="text-xs font-medium text-left p-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.slice(1).map((row, i) => (
                            <tr key={i} className="border-b last:border-0">
                              {row.map((cell, j) => (
                                <td key={j} className="text-xs p-3">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Field Mapping */}
              {showMapping && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">4. 字段映射</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setShowConfirm(true)}>
                        下一步：确认导入 <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-4">请将Excel列与系统字段进行对应</p>
                    <div className="space-y-3">
                      {previewData[0]?.map((col, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-48 text-xs font-medium bg-[#f5f6fa] rounded px-3 py-2">
                            Excel: {col}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Select defaultValue={col}>
                            <SelectTrigger className="w-48 h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={col}>系统字段: {col}</SelectItem>
                              <SelectItem value="skip">跳过此列</SelectItem>
                            </SelectContent>
                          </Select>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Confirm with errors */}
              {showConfirm && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">5. 数据校验与确认</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>有效数据：<span className="font-medium text-green-600">18条</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span>错误数据：<span className="font-medium text-red-500">4条</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span>重复数据：<span className="font-medium text-yellow-500">2条</span></span>
                      </div>
                    </div>
                    
                    {mockErrors.length > 0 && (
                      <div className="border rounded-lg p-3">
                        <p className="text-xs font-medium text-red-600 mb-2">错误提醒：</p>
                        <div className="space-y-1">
                          {mockErrors.map((err, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">第{err.row}行</span>
                              <span className="font-medium">{err.field}</span>
                              <span className="text-red-500">- {err.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm">跳过错误行导入</Button>
                      <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={handleConfirmImport}>
                        确认导入有效数据
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">导入完成</h3>
                <p className="text-sm text-muted-foreground mb-4">已成功导入 18 条记录，跳过 4 条错误数据</p>
                <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={handleReset}>
                  继续导入
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">导入时间</TableHead>
                    <TableHead className="text-xs">导入类型</TableHead>
                    <TableHead className="text-xs">文件名</TableHead>
                    <TableHead className="text-xs text-right">总行数</TableHead>
                    <TableHead className="text-xs text-right">成功</TableHead>
                    <TableHead className="text-xs text-right">失败</TableHead>
                    <TableHead className="text-xs text-center">状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs">2025-06-10 14:30</TableCell>
                    <TableCell className="text-xs">客户资料</TableCell>
                    <TableCell className="text-xs">客户资料_20250610.xlsx</TableCell>
                    <TableCell className="text-xs text-right">25</TableCell>
                    <TableCell className="text-xs text-right text-green-600">22</TableCell>
                    <TableCell className="text-xs text-right text-red-500">3</TableCell>
                    <TableCell className="text-center"><Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700">完成</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs">2025-05-28 10:15</TableCell>
                    <TableCell className="text-xs">库存数据</TableCell>
                    <TableCell className="text-xs">库存盘点_0528.xlsx</TableCell>
                    <TableCell className="text-xs text-right">50</TableCell>
                    <TableCell className="text-xs text-right text-green-600">48</TableCell>
                    <TableCell className="text-xs text-right text-red-500">2</TableCell>
                    <TableCell className="text-center"><Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700">完成</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="template" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4">下载导入模板，按照模板格式填写数据后上传</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {importTypes.map(t => (
                  <button
                    key={t.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#1e3a5f] transition-colors text-left"
                    onClick={() => toast.success(`模板下载成功：${t.label}模板.xlsx`)}
                  >
                    <FileSpreadsheet className="h-5 w-5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{t.label}模板</p>
                      <p className="text-[10px] text-muted-foreground">.xlsx 格式</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
