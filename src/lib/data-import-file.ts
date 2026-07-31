import type { DataImportType, ParsedSpreadsheet } from '@/lib/data-import';
import { DATA_IMPORT_CONFIGS, templateRows } from '@/lib/data-import';

const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ['xlsx', 'xls', 'csv'];
const WHATSAPP_REQUIRED_HEADERS = ['country_name', 'formatted_phone'];
const WHATSAPP_NAME_HEADERS = ['备注名', '公开名', '姓名'];

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

function isTruthyCell(value: string): boolean {
  return ['1', 'true', 'yes', 'y', '是'].includes(value.trim().toLowerCase());
}

function findWhatsAppHeaderRow(matrix: string[][]): number {
  return matrix.slice(0, 10).findIndex((row) => {
    const headers = new Set(row.map((value) => value.trim()));
    return (
      WHATSAPP_REQUIRED_HEADERS.every((header) => headers.has(header)) &&
      WHATSAPP_NAME_HEADERS.some((header) => headers.has(header))
    );
  });
}

export function convertWhatsAppContacts(
  sheetName: string,
  matrix: string[][],
): ParsedSpreadsheet | null {
  const headerRowIndex = findWhatsAppHeaderRow(matrix);
  if (headerRowIndex < 0) return null;

  const sourceHeaders = matrix[headerRowIndex];
  const columnByHeader = new Map(
    sourceHeaders.map((header, index) => [header.trim(), index]),
  );
  const valueAt = (row: string[], header: string): string => {
    const index = columnByHeader.get(header);
    return index === undefined ? '' : String(row[index] ?? '').trim();
  };
  const outputRows: string[][] = [];
  let ignoredRows = 0;

  for (const row of matrix.slice(headerRowIndex + 1)) {
    const country = valueAt(row, 'country_name');
    const whatsapp = valueAt(row, 'formatted_phone');
    const name =
      valueAt(row, '备注名') ||
      valueAt(row, '公开名') ||
      valueAt(row, '姓名');
    const blocked = isTruthyCell(valueAt(row, '是否被拉黑'));
    const hasCoreData = Boolean(country || whatsapp || name);
    if (blocked || !hasCoreData) {
      ignoredRows += 1;
      continue;
    }

    const notes: string[] = [];
    const labels = valueAt(row, 'labels');
    if (labels) notes.push(`WhatsApp标签：${labels}`);
    if (isTruthyCell(valueAt(row, '是否business账号'))) {
      notes.push('WhatsApp Business账号');
    }
    outputRows.push([
      name,
      country,
      '',
      whatsapp,
      '',
      '',
      notes.join('；'),
    ]);
  }

  return {
    sheetName,
    headers: ['客户名称', '国家', '城市', 'WhatsApp', '常买品类', '常用尺码', '备注'],
    rows: outputRows,
    detectedFormat: 'whatsapp-contacts',
    sourceHeaderRow: headerRowIndex + 1,
    ignoredRows,
  };
}

export async function parseImportFile(
  file: File,
  importType?: DataImportType,
): Promise<ParsedSpreadsheet> {
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
  const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
  });
  const matrix = rawMatrix.map((row) =>
    row.map((value) => String(value ?? '').trim()),
  );
  if (matrix.length === 0) throw new Error('文件中没有数据');
  if (importType === 'customers') {
    const converted = convertWhatsAppContacts(sheetName, matrix);
    if (converted) {
      if (converted.rows.length === 0) {
        throw new Error('未找到可导入的 WhatsApp 联系人');
      }
      return converted;
    }
  }
  const headers = matrix[0];
  if (!headers.some(Boolean)) throw new Error('第一行必须包含列名');
  const rows = matrix
    .slice(1)
    .map((row) => headers.map((_, index) => row[index] ?? ''))
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
