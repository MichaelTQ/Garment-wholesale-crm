'use client';

import { usePathname } from 'next/navigation';
import { MobileSidebar } from './sidebar';
import { Bell, Cloud, CloudOff, LoaderCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useBusinessState } from '@/lib/state/provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const pageTitles: Record<string, string> = {
  '/': '首页仪表盘',
  '/customers': '客户管理',
  '/orders': '销售订单',
  '/shipping': '发货管理',
  '/payments': '收款管理',
  '/products': '商品管理',
  '/inventory': '库存管理',
  '/factories': '工厂管理',
  '/finance': '财务报表',
  '/notifications': '上新通知',
  '/import': '数据导入',
  '/settings': '系统设置',
  '/receivables': '客户应收汇总',
  '/factory-payments': '工厂付款',
};

export function AppHeader() {
  const pathname = usePathname();
  const { syncStatus, syncError, retrySync } = useBusinessState();
  const basePath = '/' + (pathname.split('/')[1] || '');
  const title = pageTitles[basePath] || pageTitles[pathname] || 'Helen服装批发管理系统';
  const syncLabel =
    syncStatus === 'synced'
      ? '已同步'
      : syncStatus === 'error'
        ? '同步失败'
        : syncStatus === 'loading'
          ? '连接数据库'
          : '同步中';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 lg:px-6">
      <MobileSidebar />
      <h1 className="text-lg font-semibold text-[#1f2937]">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={syncStatus === 'error' ? 'text-red-600 hover:text-red-700' : 'text-muted-foreground'}
          onClick={syncStatus === 'error' ? retrySync : undefined}
          disabled={syncStatus === 'loading' || syncStatus === 'syncing'}
          title={syncError ?? syncLabel}
          aria-label={syncStatus === 'error' ? `${syncLabel}，点击重试` : syncLabel}
        >
          {syncStatus === 'synced' && <Cloud className="h-4 w-4" />}
          {syncStatus === 'error' && <CloudOff className="h-4 w-4" />}
          {(syncStatus === 'loading' || syncStatus === 'syncing') && (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          )}
          <span className="hidden text-xs sm:inline">{syncLabel}</span>
        </Button>
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索..."
            className="h-8 w-56 pl-8 text-sm bg-[#f5f6fa] border-[#e5e7eb]"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            3
          </span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-[#1e3a5f] text-white text-xs">He</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline-block">Helen</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>个人设置</DropdownMenuItem>
            <DropdownMenuItem>系统设置</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">退出登录</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
