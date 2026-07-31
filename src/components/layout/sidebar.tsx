'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Truck,
  Wallet,
  Package,
  Warehouse,
  Factory,
  BarChart3,
  Bell,
  Upload,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

const navItems = [
  { label: '首页仪表盘', href: '/', icon: LayoutDashboard },
  { label: '客户管理', href: '/customers', icon: Users },
  { label: '销售订单', href: '/orders', icon: ShoppingCart },
  { label: '发货管理', href: '/shipping', icon: Truck },
  { label: '收款管理', href: '/payments', icon: Wallet },
  { label: '商品管理', href: '/products', icon: Package },
  { label: '库存管理', href: '/inventory', icon: Warehouse },
  { label: '工厂管理', href: '/factories', icon: Factory },
  { label: '财务报表', href: '/finance', icon: BarChart3 },
  { label: '上新通知', href: '/notifications', icon: Bell },
  { label: '数据导入', href: '/data-import', icon: Upload },
  { label: '系统设置', href: '/settings', icon: Settings },
];

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[#1e3a5f]">
      {/* Logo Area */}
      <div className={cn('flex items-center border-b border-white/10 px-4 py-4', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white font-bold text-sm">
          H
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">Helen服装批发</div>
            <div className="truncate text-xs text-white/60">Wholesale Management</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-white/20 text-white font-medium'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className={cn('border-t border-white/10 px-3 py-3', collapsed ? 'flex flex-col items-center' : '')}>
        <div className={cn('flex items-center gap-3', collapsed && 'flex-col')}>
          <Avatar className="h-8 w-8 shrink-0 border-2 border-white/30">
            <AvatarFallback className="bg-white/20 text-white text-xs">He</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white">Helen</div>
              <div className="text-xs text-white/60">管理员</div>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-white/60 hover:text-white hover:bg-white/10 px-2">
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-xs">退出</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-[#1e3a5f] transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <SidebarContent collapsed={collapsed} />
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -translate-y-1/2 z-10 flex h-8 w-4 items-center justify-center rounded-r bg-[#1e3a5f] text-white/70 hover:text-white"
        style={{ left: collapsed ? '60px' : '236px' }}
      >
        <ChevronLeft className={cn('h-3 w-3 transition-transform', collapsed && 'rotate-180')} />
      </button>
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SheetTitle className="sr-only">导航菜单</SheetTitle>
        <SidebarContent collapsed={false} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
