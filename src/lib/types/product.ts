import type { Product } from '@/lib/mock-data';

export type ProductStatus = Product['status'];

export const DEFAULT_PRODUCT_CATEGORIES = [
  '牛仔裤',
  'T恤',
  '连衣裙',
  '卫衣',
  '外套',
  '半裙',
  '其他',
] as const;

export interface ProductFormValue {
  styleNo: string;
  name: string;
  category: string;
  suggestedPrice: number;
  status: ProductStatus;
  newDate: string;
  colors: string;
  sizes: string;
  imageUrl: string;
  description: string;
  notes: string;
}

export const emptyProductFormValue: ProductFormValue = {
  styleNo: '',
  name: '',
  category: '',
  suggestedPrice: 0,
  status: '设计中',
  newDate: '',
  colors: '',
  sizes: '',
  imageUrl: '',
  description: '',
  notes: '',
};

export function splitFormList(value: string): string[] {
  return [...new Set(
    value
      .split(/[,，、\n]/)
      .map((item) => item.trim())
      .filter(Boolean),
  )];
}

export function productToFormValue(product: Product): ProductFormValue {
  return {
    styleNo: product.styleNo,
    name: product.name,
    category: product.category,
    suggestedPrice: product.suggestedPrice,
    status: product.status,
    newDate: product.newDate,
    colors: product.colors.map((color) => color.name).join('、'),
    sizes: product.sizes.join('、'),
    imageUrl: product.images[0] ?? '',
    description: product.description,
    notes: product.notes ?? '',
  };
}

export function productFromFormValue(
  value: ProductFormValue,
  id: string,
  currentStock = 0,
): Product {
  const colors = splitFormList(value.colors);
  const sizes = splitFormList(value.sizes);

  return {
    id,
    styleNo: value.styleNo.trim(),
    name: value.name.trim(),
    category: value.category.trim(),
    colors: colors.map((name) => ({ name, hex: '#d1d5db' })),
    sizes,
    images: value.imageUrl.trim() ? [value.imageUrl.trim()] : [],
    currentStock,
    suggestedPrice: value.suggestedPrice,
    lastCost: 0,
    newDate: value.newDate,
    status: value.status,
    description: value.description.trim(),
    notes: value.notes.trim(),
  };
}
