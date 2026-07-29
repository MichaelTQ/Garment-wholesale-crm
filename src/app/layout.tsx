import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Helen服装批发管理系统',
    template: '%s | Helen服装批发管理系统',
  },
  description: '服装外贸批发业务管理系统 - 客户管理、订单管理、库存管理、财务报表',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
