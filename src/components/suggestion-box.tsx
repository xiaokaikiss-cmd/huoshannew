'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function SuggestionBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('请输入修改意见');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('提交成功，感谢您的反馈！');
        setContent('');
        setIsOpen(false);
      } else {
        toast.error(data.error || '提交失败');
      }
    } catch (error) {
      console.error('提交建议失败:', error);
      toast.error('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 rounded-lg border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400"
        >
          <MessageSquare className="w-4 h-4 mr-1" />
          <span className="text-xs">意见反馈</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            提交修改意见
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            修改意见会在 <span className="text-cyan-400 font-medium">24小时内</span> 受理，请放心大胆提交！
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Textarea
              placeholder="请输入您的修改意见..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50 resize-none"
            />
            <p className="text-[10px] text-muted-foreground/80">
              {content.length}/500 字符
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setContent('');
              setIsOpen(false);
            }}
            className="border-slate-700 hover:bg-slate-800"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-4 h-4" />
              </motion.div>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                提交
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
