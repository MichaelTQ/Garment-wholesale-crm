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
import { Search, Plus, Eye, Edit } from 'lucide-react';
import { formatCurrency, getStatusColor } from '@/lib/mock-data';
import { toast } from 'sonner';
import { useBusinessState } from '@/lib/state/provider';
import { ProductFormFields } from '@/components/products/product-form-fields';
import {
  emptyProductFormValue,
  DEFAULT_PRODUCT_CATEGORIES,
  productFromFormValue,
  splitFormList,
  type ProductFormValue,
} from '@/lib/types/product';

const statusOptions = ['全部', '设计中', '生产中', '已上新', '正常销售', '库存不足', '已停售'];

export default function ProductsPage() {
  const { products, addProduct } = useBusinessState();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormValue>(emptyProductFormValue);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const categories = [...new Set([
    ...DEFAULT_PRODUCT_CATEGORIES,
    ...products.map((product) => product.category),
  ])];

  const handleAddProduct = () => {
    const errors: string[] = [];
    if (!productForm.styleNo.trim()) errors.push('请输入款号');
    if (products.some((product) => product.styleNo.toLowerCase() === productForm.styleNo.trim().toLowerCase())) {
      errors.push('该款号已经存在');
    }
    if (!productForm.name.trim()) errors.push('请输入商品名称');
    if (!productForm.category) errors.push('请选择商品分类');
    if (productForm.suggestedPrice < 0) errors.push('建议销售价不能为负数');
    if (splitFormList(productForm.colors).length === 0) errors.push('请至少填写一种颜色');
    if (splitFormList(productForm.sizes).length === 0) errors.push('请至少填写一个尺码');
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    addProduct(productFromFormValue(
      productForm,
      `p-${productForm.styleNo.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    ));
    setShowAddDialog(false);
    setFormErrors([]);
    setProductForm(emptyProductFormValue);
    toast.success('商品创建成功');
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.styleNo.toLowerCase().includes(search.toLowerCase()) || p.name.includes(search);
    const matchCategory = categoryFilter === '全部' || p.category === categoryFilter;
    const matchStatus = statusFilter === '全部' || p.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
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
              <Input placeholder="搜索款号或商品名称..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-8 h-9" />
            </div>
            <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-32 h-9"><SelectValue placeholder="分类" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部分类</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-32 h-9"><SelectValue placeholder="状态" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="ml-auto">
              <Button size="sm" className="h-9 bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> 新增商品
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
                  <TableHead className="text-xs">图片</TableHead>
                  <TableHead className="text-xs">款号</TableHead>
                  <TableHead className="text-xs">商品名称</TableHead>
                  <TableHead className="text-xs">分类</TableHead>
                  <TableHead className="text-xs text-right">颜色</TableHead>
                  <TableHead className="text-xs text-right">尺码</TableHead>
                  <TableHead className="text-xs text-right">当前库存</TableHead>
                  <TableHead className="text-xs text-right">建议销售价</TableHead>
                  <TableHead className="text-xs">上新日期</TableHead>
                  <TableHead className="text-xs text-center">状态</TableHead>
                  <TableHead className="text-xs text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="h-10 w-10 rounded bg-[#f5f6fa] flex items-center justify-center text-xs text-muted-foreground border">
                        {p.styleNo.slice(0, 2)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{p.styleNo}</TableCell>
                    <TableCell className="text-xs">{p.name}</TableCell>
                    <TableCell className="text-xs">{p.category}</TableCell>
                    <TableCell className="text-xs text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.colors.slice(0, 3).map((c, i) => (
                          <span key={i} className="inline-block h-3.5 w-3.5 rounded-full border" style={{ backgroundColor: c.hex }} title={c.name} />
                        ))}
                        {p.colors.length > 3 && <span className="text-[10px]">+{p.colors.length - 3}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-right">{p.sizes.length}个</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{p.currentStock}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{formatCurrency(p.suggestedPrice)}</TableCell>
                    <TableCell className="text-xs">{p.newDate}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(p.status)}`}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/products/${p.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                      </div>
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

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增商品</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <ProductFormFields
              value={productForm}
              onChange={setProductForm}
              categories={categories}
            />
            {formErrors.length > 0 && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
                {formErrors.map((error) => (
                  <p key={error} className="text-sm text-red-700">{error}</p>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={handleAddProduct}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
