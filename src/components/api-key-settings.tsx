'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Key,
  Eye,
  EyeOff,
  Save,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

const API_KEY_STORAGE_KEY = 'wetoken_api_key';

export function ApiKeySettings() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 从 localStorage 加载 API Key
  useEffect(() => {
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('请输入 API Key');
      return;
    }

    // 简单验证：检查 API Key 格式（以 sk- 开头）
    if (!apiKey.startsWith('sk-')) {
      toast.error('API Key 格式不正确，应以 sk- 开头');
      return;
    }

    setIsSaving(true);
    try {
      // 保存到 localStorage
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
      // 触发自定义事件，通知其他组件更新
      window.dispatchEvent(new Event('apiKeyUpdated'));
      toast.success('API Key 已保存');
      setIsOpen(false);
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey('');
    // 触发自定义事件，通知其他组件更新
    window.dispatchEvent(new Event('apiKeyUpdated'));
    toast.success('API Key 已清除');
  };

  const hasApiKey = apiKey.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={hasApiKey ? 'outline' : 'default'}
          size="sm"
          className={hasApiKey
            ? 'h-9 px-3 rounded-lg border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
            : 'h-9 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white'
          }
        >
          <Key className={`w-4 h-4 mr-1 ${hasApiKey ? 'text-emerald-400' : ''}`} />
          <span className="text-xs">
            {hasApiKey ? 'API Key 已配置' : '配置 API Key'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-5 h-5 text-cyan-400" />
            配置 API Key
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            配置您的火山引擎 API Key，用于素材上传和管理
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              API Key
            </Label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-11 pr-12 bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/80">
              🔒 您的 API Key 仅保存在浏览器本地，不会上传到服务器
            </p>
          </div>

          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Key className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-cyan-400/80">
                <p className="font-medium mb-1">如何获取 API Key？</p>
                <p className="text-muted-foreground">请联系老大，找他要 API 密钥</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {hasApiKey && (
            <Button
              variant="outline"
              onClick={handleClear}
              className="border-red-500/30 hover:bg-red-500/10 text-red-400"
            >
              清除
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
          >
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Key className="w-4 h-4" />
              </motion.div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 导出获取 API Key 的函数
export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}
