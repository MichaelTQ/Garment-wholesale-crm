'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useBusinessState } from '@/lib/state/provider';
import { BUSINESS_STORAGE_KEY } from '@/lib/types/business';

export default function SettingsPage() {
  const { resetBusinessData } = useBusinessState();
  const [businessName, setBusinessName] = useState('Helen服装批发');
  const [contactName, setContactName] = useState('Helen');
  const [phone, setPhone] = useState('+86 138 0013 8000');
  const [email, setEmail] = useState('helen@example.com');
  const [address, setAddress] = useState('广州市白云区服装城A区108号');
  const [currency] = useState('CNY');
  const [language] = useState('zh-CN');
  const [whatsappDefault, setWhatsappDefault] = useState('+86 138 0013 8000');

  const handleSave = () => {
    toast.success('设置已保存');
  };

  const handleExport = () => {
    const stored = window.localStorage.getItem(BUSINESS_STORAGE_KEY);
    const blob = new Blob([stored ?? '{}'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `helen-crm-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('业务数据备份已导出');
  };

  const handleReset = () => {
    if (!window.confirm('确认清空所有客户、商品、库存、订单、发货和收款数据吗？仓库配置会保留。此操作不可撤销。')) return;
    resetBusinessData();
    toast.success('全部业务数据已清空，仓库配置已保留');
  };

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Business Info */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">商家信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>商家名称</Label>
              <Input value={businessName} onChange={e => setBusinessName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>联系人</Label>
              <Input value={contactName} onChange={e => setContactName(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>联系电话</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>地址</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">系统设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>货币单位</Label>
              <Select value={currency} disabled>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNY">人民币 (¥)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>系统语言</Label>
              <Select value={language} disabled>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">简体中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>默认WhatsApp号码</Label>
              <Input value={whatsappDefault} onChange={e => setWhatsappDefault(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>库存单位</Label>
              <Input value="件" disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">通知设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: '低库存预警', desc: '当商品库存低于设定值时提醒' },
            { label: '订单确认通知', desc: '新订单确认时提醒' },
            { label: '收款到账通知', desc: '收到客户付款时提醒' },
            { label: '发货完成通知', desc: '订单发货完成时提醒' },
            { label: '付款到期提醒', desc: '工厂付款到期前提醒' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <button
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${i < 3 ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`}
                onClick={() => {}}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${i < 3 ? 'translate-x-4.5' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">数据管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">数据备份</p>
              <p className="text-xs text-muted-foreground">导出系统所有数据为备份文件</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>导出备份</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">清空全部业务数据</p>
              <p className="text-xs text-muted-foreground">删除客户、商品、库存、订单、发货和收款，保留仓库配置</p>
            </div>
            <Button variant="outline" size="sm" className="text-red-600" onClick={handleReset}>清空数据</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={handleSave}>保存设置</Button>
      </div>
    </div>
  );
}
