'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ProductFormValue, ProductStatus } from '@/lib/types/product';

interface ProductFormFieldsProps {
  value: ProductFormValue;
  onChange: (value: ProductFormValue) => void;
  categories: string[];
  disabled?: boolean;
}

const productStatuses: ProductStatus[] = [
  '设计中',
  '生产中',
  '已上新',
  '正常销售',
  '库存不足',
  '已停售',
];

export function ProductFormFields({
  value,
  onChange,
  categories,
  disabled = false,
}: ProductFormFieldsProps) {
  const update = <K extends keyof ProductFormValue>(field: K, nextValue: ProductFormValue[K]) => {
    onChange({ ...value, [field]: nextValue });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-style-no">款号 *</Label>
          <Input
            id="product-style-no"
            value={value.styleNo}
            onChange={(event) => update('styleNo', event.target.value)}
            placeholder="如：HJ-006"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-name">商品名称 *</Label>
          <Input
            id="product-name"
            value={value.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="请输入商品名称"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>商品分类 *</Label>
          <Select value={value.category} onValueChange={(next) => update('category', next)} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-price">建议销售价 *</Label>
          <Input
            id="product-price"
            type="number"
            min={0}
            value={value.suggestedPrice || ''}
            onChange={(event) => update('suggestedPrice', Number(event.target.value))}
            placeholder="0"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>商品状态 *</Label>
          <Select value={value.status} onValueChange={(next) => update('status', next as ProductStatus)} disabled={disabled}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {productStatuses.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-new-date">上新日期</Label>
          <Input
            id="product-new-date"
            type="date"
            value={value.newDate}
            onChange={(event) => update('newDate', event.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-colors">颜色 *</Label>
          <Input
            id="product-colors"
            value={value.colors}
            onChange={(event) => update('colors', event.target.value)}
            placeholder="用逗号分隔，如：深蓝,黑色"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-sizes">尺码 *</Label>
          <Input
            id="product-sizes"
            value={value.sizes}
            onChange={(event) => update('sizes', event.target.value)}
            placeholder="用逗号分隔，如：S,M,L,XL"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-image">商品图片</Label>
        <Input
          id="product-image"
          value={value.imageUrl}
          onChange={(event) => update('imageUrl', event.target.value)}
          placeholder="输入图片地址（前端模拟）"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-description">商品描述</Label>
          <Textarea
            id="product-description"
            value={value.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="面料、版型等商品说明"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-notes">备注</Label>
          <Textarea
            id="product-notes"
            value={value.notes}
            onChange={(event) => update('notes', event.target.value)}
            placeholder="内部备注"
            disabled={disabled}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        工厂成本不在商品档案中固定保存，真实成本应来自生产批次。
      </p>
    </div>
  );
}
