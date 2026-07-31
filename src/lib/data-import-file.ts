import type { DataImportType, ParsedSpreadsheet } from '@/lib/data-import';
import { DATA_IMPORT_CONFIGS, templateRows } from '@/lib/data-import';

const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ['xlsx', 'xls', 'csv'];

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

export async function parseImportFile(file: File): Promise<ParsedSpreadsheet> {
  const extension = getExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    throw new Error('仅支持 .xlsx、.xls 和 .csv 文件');
  }
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    throw new Error('文件不能超过 10MB');
  }
  if (file.size === 0) throw new Error('文件内容为空');

  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = extension === 'csv'
    ? XLSX.read(new TextDecoder('utf-8').decode(buffer).replace(/^\uFEFF/, ''), {
        type: 'string',
        cellDates: true,
      })
    : XLSX.read(buffer, {
        type: 'array',
        cellDates: true,
      });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('文件中没有可读取的工作表');
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
  });
  if (matrix.length === 0) throw new Error('文件中没有数据');
  const headers = matrix[0].map((value) => String(value ?? '').trim());
  if (!headers.some(Boolean)) throw new Error('第一行必须包含列名');
  const rows = matrix
    .slice(1)
    .map((row) => headers.map((_, index) => String(row[index] ?? '').trim()))
    .filter((row) => row.some(Boolean));
  if (rows.length === 0) throw new Error('文件中没有可导入的数据行');
  return { sheetName, headers, rows };
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadImportTemplate(type: DataImportType): Promise<void> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(templateRows(type));
  worksheet['!cols'] = DATA_IMPORT_CONFIGS[type].fields.map((item) => ({
    wch: Math.max(item.label.length * 2 + 2, item.example.length + 2, 12),
  }));
  XLSX.utils.book_append_sheet(workbook, worksheet, '导入模板');
  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadBlob(
    new Blob([output], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${DATA_IMPORT_CONFIGS[type].label}导入模板.xlsx`,
  );
}
