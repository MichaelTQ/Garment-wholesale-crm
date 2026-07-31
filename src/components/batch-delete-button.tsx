'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BatchDeleteButtonProps {
  count: number;
  entityLabel: string;
  onConfirm: () => void;
}

export function BatchDeleteButton({
  count,
  entityLabel,
  onConfirm,
}: BatchDeleteButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="h-9"
          disabled={count === 0}
        >
          <Trash2 className="h-4 w-4" />
          删除{count > 0 ? `（${count}）` : ''}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除所选{entityLabel}？</AlertDialogTitle>
          <AlertDialogDescription>
            将永久删除 {count} 条{entityLabel}，并实时同步到数据库及其他页面。
            已被业务单据引用的记录会被系统阻止删除。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
          >
            确认删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
