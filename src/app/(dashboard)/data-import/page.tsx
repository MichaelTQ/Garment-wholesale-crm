'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  analyzeImport,
  applyImport,
  createAutomaticMapping,
  DATA_IMPORT_CONFIGS,
  DATA_IMPORT_TYPES,
  mapSpreadsheetRows,
  type DataImportType,
  type DuplicateMode,
  type ImportAnalysis,
  type ParsedSpreadsheet,
} from '@/lib/data-import';
import { downloadImportTemplate, parseImportFile } from '@/lib/data-import-file';
import { useBusinessState } from '@/lib/state/provider';
import type { BusinessState } from '@/lib/types/business';

const IMPORT_HISTORY_KEY = 'helen-crm-import-history-v1';

interface ImportHistoryEntry {
  id: string;
  importedAt: string;
  type: DataImportType;
  fileName: string;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  status: '成功' | '部分成功';
}

function readHistory(): ImportHistoryEntry[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(IMPORT_HISTORY_KEY) ?? '[]') as unknown;
    return Array.isArray(parsed) ? parsed as ImportHistoryEntry[] : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: ImportHistoryEntry[]): void {
  window.localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(entries.slice(0, 50)));
}

function businessSnapshot(business: ReturnType<typeof useBusinessState>): BusinessState {
  return {
    storageVersion: business.storageVersion,
    customers: business.customers,
    products: business.products,
    warehouses: business.warehouses,
    factories: business.factories,
    productionBatches: business.productionBatches,
    factoryPayments: business.factoryPayments,
    inventoryRecords: business.inventoryRecords,
    inventoryFlows: business.inventoryFlows,
    inventoryReservations: business.inventoryReservations,
    orders: business.orders,
    shipments: business.shipments,
    payments: business.payments,
    paymentAllocations: business.paymentAllocations,
    depositApplications: business.depositApplications,
    customerLedgers: business.customerLedgers,
  };
}

export default function DataImportPage() {
  const business = useBusinessState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<DataImportType | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>('skip');
  const [showValidation, setShowValidation] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [history, setHistory] = useState<ImportHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const mappedRows = useMemo(
    () => parsed ? mapSpreadsheetRows(parsed, mapping) : [],
    [mapping, parsed],
  );
  const analysis: ImportAnalysis | null = useMemo(() => {
    if (!selectedType || !parsed) return null;
    return analyzeImport(
      selectedType,
      mappedRows,
      businessSnapshot(business),
      duplicateMode,
    );
  }, [
    business,
    duplicateMode,
    mappedRows,
    parsed,
    selectedType,
  ]);

  const resetFileSteps = () => {
    setUploadedFile(null);
    setParsed(null);
    setMapping({});
    setShowValidation(false);
    setImportComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTypeChange = (type: DataImportType) => {
    setSelectedType(type);
    resetFileSteps();
  };

  const handleFile = async (file: File) => {
    setIsReading(true);
    setShowValidation(false);
    setImportComplete(false);
    try {
      const nextParsed = await parseImportFile(file, selectedType ?? undefined);
      if (!selectedType) throw new Error('请先选择导入类型');
      setUploadedFile(file);
      setParsed(nextParsed);
      setMapping(createAutomaticMapping(selectedType, nextParsed.headers));
      toast.success(
        nextParsed.detectedFormat === 'whatsapp-contacts'
          ? `已识别 WhatsApp 联系人格式，可导入 ${nextParsed.rows.length} 行`
          : `已读取 ${nextParsed.rows.length} 行数据`,
      );
    } catch (error: unknown) {
      resetFileSteps();
      toast.error(error instanceof Error ? error.message : '文件读取失败');
    } finally {
      setIsReading(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const handleConfirmImport = () => {
    if (!selectedType || !uploadedFile || !analysis || analysis.validRows === 0) return;
    setIsImporting(true);
    try {
      const result = applyImport(
        selectedType,
        analysis.importableRows,
        businessSnapshot(business),
      );
      const operation = business.importBusinessState(result.state);
      if (!operation.ok) throw new Error(operation.error ?? '业务数据写入失败');
      const entry: ImportHistoryEntry = {
        id: globalThis.crypto.randomUUID(),
        importedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        type: selectedType,
        fileName: uploadedFile.name,
        totalRows: analysis.totalRows,
        importedRows: analysis.validRows,
        failedRows: analysis.totalRows - analysis.validRows,
        status:
          analysis.errorRows > 0 ||
          (duplicateMode === 'skip' && analysis.duplicateRows > 0)
            ? '部分成功'
            : '成功',
      };
      const nextHistory = [entry, ...history].slice(0, 50);
      setHistory(nextHistory);
      writeHistory(nextHistory);
      setImportComplete(true);
      toast.success(`成功迁入 ${analysis.validRows} 行业务数据`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '导入失败，未写入任何数据');
    } finally {
      setIsImporting(false);
    }
  };

  const handleTemplateDownload = async (type: DataImportType) => {
    try {
      await downloadImportTemplate(type);
      toast.success(`${DATA_IMPORT_CONFIGS[type].label}模板已下载`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '模板生成失败');
    }
  };

  const config = selectedType ? DATA_IMPORT_CONFIGS[selectedType] : null;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="import">
        <TabsList className="bg-white">
          <TabsTrigger value="import">数据导入</TabsTrigger>
          <TabsTrigger value="history">导入历史</TabsTrigger>
          <TabsTrigger value="template">下载模板</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-4">
          {importComplete ? (
            <Card className="shadow-sm">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
                <h2 className="mb-2 text-lg font-semibold">数据迁入完成</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  已写入业务数据，并进入现有的本地与云数据库同步队列。
                </p>
                <Button onClick={resetFileSteps} size="sm">
                  <RotateCcw className="mr-1 h-4 w-4" />继续导入
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">1. 选择导入类型</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {DATA_IMPORT_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleTypeChange(type.id)}
                        className={`rounded-lg border p-3 text-left text-sm transition-all ${
                          selectedType === type.id
                            ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 ring-1 ring-[#1e3a5f]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="mb-2 flex items-center gap-2 font-medium">
                          <span className="text-lg">{type.icon}</span>{type.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">{type.description}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {config && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">2. 上传文件</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleDrop}
                      className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center"
                    >
                      <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">拖拽文件到此处，或点击选择文件</p>
                      <p className="mb-4 text-xs text-muted-foreground">支持 .xlsx、.xls、.csv，最大 10MB；读取首个工作表</p>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isReading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-1 h-4 w-4" />
                        {isReading ? '正在读取…' : '选择文件'}
                      </Button>
                      {uploadedFile && parsed && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{uploadedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(uploadedFile.size / 1024).toFixed(1)} KB · {parsed.rows.length} 行
                          </span>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>
                    {parsed?.detectedFormat === 'whatsapp-contacts' && (
                      <Alert className="mt-4 border-blue-200 bg-blue-50">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        <AlertTitle>已识别 WhatsApp 联系人列表</AlertTitle>
                        <AlertDescription>
                          已从第 {parsed.sourceHeaderRow} 行识别真实表头，只读取第一个工作表；
                          客户名称按“备注名 → 公开名/姓名”转换，并忽略拉黑或没有核心资料的
                          {parsed.ignoredRows ?? 0} 行。
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {parsed && config && (
                <>
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">3. 数据预览（前 10 行）</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-14 text-xs">行号</TableHead>
                              {parsed.headers.map((header, index) => (
                                <TableHead key={`${header}-${index}`} className="whitespace-nowrap text-xs">
                                  {header || `未命名列 ${index + 1}`}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parsed.rows.slice(0, 10).map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                <TableCell className="text-xs text-muted-foreground">{rowIndex + 2}</TableCell>
                                {parsed.headers.map((_, cellIndex) => (
                                  <TableCell key={cellIndex} className="max-w-56 truncate text-xs">
                                    {row[cellIndex]}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">4. 字段映射</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-xs text-muted-foreground">
                        已按列名自动匹配。带 * 的系统字段为必填项，可手动调整或跳过无关列。
                      </p>
                      <div className="grid gap-3 lg:grid-cols-2">
                        {parsed.headers.map((header, index) => (
                          <div key={`${header}-${index}`} className="flex items-center gap-3">
                            <div className="w-44 truncate rounded bg-[#f5f6fa] px-3 py-2 text-xs font-medium">
                              文件：{header || `未命名列 ${index + 1}`}
                            </div>
                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <Select
                              value={mapping[index] ?? 'skip'}
                              onValueChange={(value) => {
                                setMapping((current) => ({ ...current, [index]: value }));
                                setShowValidation(false);
                              }}
                            >
                              <SelectTrigger className="h-9 flex-1 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="skip">跳过此列</SelectItem>
                                {config.fields.map((item) => (
                                  <SelectItem key={item.key} value={item.key}>
                                    {item.label}{item.required ? ' *' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">重复数据：</span>
                          <Select
                            value={duplicateMode}
                            onValueChange={(value: DuplicateMode) => {
                              setDuplicateMode(value);
                              setShowValidation(false);
                            }}
                          >
                            <SelectTrigger className="h-9 w-40 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skip">跳过已有数据</SelectItem>
                              <SelectItem value="replace">覆盖已有数据</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="button" size="sm" onClick={() => setShowValidation(true)}>
                          校验数据 <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {showValidation && analysis && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">5. 数据校验与确认</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">总数据</p>
                        <p className="text-xl font-semibold">{analysis.totalRows} 行</p>
                      </div>
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                        <p className="text-xs text-green-700">可导入</p>
                        <p className="text-xl font-semibold text-green-700">{analysis.validRows} 行</p>
                      </div>
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="text-xs text-red-700">错误</p>
                        <p className="text-xl font-semibold text-red-700">{analysis.errorRows} 行</p>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs text-amber-700">重复</p>
                        <p className="text-xl font-semibold text-amber-700">{analysis.duplicateRows} 行</p>
                      </div>
                    </div>

                    {analysis.issues.length > 0 ? (
                      <div className="max-h-64 overflow-auto rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-20 text-xs">行号</TableHead>
                              <TableHead className="w-32 text-xs">字段</TableHead>
                              <TableHead className="text-xs">问题</TableHead>
                              <TableHead className="w-20 text-xs">类型</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analysis.issues.map((issue, index) => (
                              <TableRow key={`${issue.row}-${issue.field}-${index}`}>
                                <TableCell className="text-xs">第 {issue.row} 行</TableCell>
                                <TableCell className="text-xs font-medium">{issue.field}</TableCell>
                                <TableCell className="text-xs">{issue.message}</TableCell>
                                <TableCell>
                                  <Badge variant={issue.kind === 'error' ? 'destructive' : 'secondary'}>
                                    {issue.kind === 'error' ? '错误' : issue.kind === 'duplicate' ? '重复' : '提醒'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle>校验通过</AlertTitle>
                        <AlertDescription>所有数据均符合当前业务规则。</AlertDescription>
                      </Alert>
                    )}

                    {analysis.errorRows > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>存在无效数据</AlertTitle>
                        <AlertDescription>
                          错误行不会写入；其余有效行仍可一次性导入。单次写入失败时整批回滚。
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        disabled={analysis.validRows === 0 || isImporting}
                        onClick={handleConfirmImport}
                      >
                        {isImporting ? '正在迁入…' : `确认迁入 ${analysis.validRows} 行有效数据`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
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
                    <TableHead className="text-right text-xs">总行数</TableHead>
                    <TableHead className="text-right text-xs">成功</TableHead>
                    <TableHead className="text-right text-xs">未导入</TableHead>
                    <TableHead className="text-center text-xs">状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        暂无导入历史
                      </TableCell>
                    </TableRow>
                  ) : history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs">{entry.importedAt}</TableCell>
                      <TableCell className="text-xs">{DATA_IMPORT_CONFIGS[entry.type].label}</TableCell>
                      <TableCell className="max-w-64 truncate text-xs">{entry.fileName}</TableCell>
                      <TableCell className="text-right text-xs">{entry.totalRows}</TableCell>
                      <TableCell className="text-right text-xs text-green-700">{entry.importedRows}</TableCell>
                      <TableCell className="text-right text-xs text-red-600">{entry.failedRows}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={entry.status === '成功' ? 'default' : 'secondary'}>{entry.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="template" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <p className="mb-4 text-sm text-muted-foreground">
                下载标准 Excel 模板。示例行仅用于说明格式，正式导入前可删除。
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {DATA_IMPORT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-[#1e3a5f]"
                    onClick={() => void handleTemplateDownload(type.id)}
                  >
                    <FileSpreadsheet className="h-5 w-5 shrink-0 text-green-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{type.label}模板</p>
                      <p className="text-[10px] text-muted-foreground">.xlsx 格式</p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
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
