'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('Helen服装批发');
  const [contactName, setContactName] = useState('Helen');
  const [phone, setPhone] = useState('+86 138 0013 8000');
  const [email, setEmail] = useState('helen@example.com');
  const [address, setAddress] = useState('广州市白云区服装城A区108号');
  const [currency, setCurrency] = useState('CNY');
  const [language, setLanguage] = useState('zh-CN');
  const [whatsappDefault, setWhatsappDefault] = useState('+86 138 0013 8000');

  const handleSave = () => {
    toast.success('设置已保存');
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
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNY">人民币 (¥)</SelectItem>
                  <SelectItem value="USD">美元 ($)</SelectItem>
                  <SelectItem value="EUR">欧元 (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>系统语言</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">简体中文</SelectItem>
                  <SelectItem value="en">English</SelectItem>
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
            <Button variant="outline" size="sm" onClick={() => toast.success('备份功能开发中')}>导出备份</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">清除缓存</p>
              <p className="text-xs text-muted-foreground">清除浏览器缓存数据</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.success('缓存已清除')}>清除</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8e]" onClick={handleSave}>保存设置</Button>
      </div>
    </div>
  );
}
