'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Upload,
  Sparkles,
  Zap,
  Image,
  Video,
  Music,
  ArrowRight,
  Rocket,
} from 'lucide-react';
import { WorkflowProgress, WorkflowStatus } from './workflow-progress';

interface CyberUploadFormProps {
  onUploadSuccess: () => void;
}

const assetTypes = [
  { value: 'Image', label: '图片', icon: Image, color: 'from-cyan-500 to-blue-500' },
  { value: 'Video', label: '视频', icon: Video, color: 'from-purple-500 to-pink-500' },
  { value: 'Audio', label: '音频', icon: Music, color: 'from-green-500 to-emerald-500' },
] as const;

const assetTypeRestrictions = {
  Image: {
    format: 'jpeg、png、webp、bmp、tiff、gif、heic/heif',
    ratio: '0.4 ~ 2.5',
    size: '< 30 MB',
    resolution: '300px ~ 6000px',
    duration: '-',
    fps: '-',
  },
  Video: {
    format: 'mp4、mov',
    ratio: '0.4 ~ 2.5',
    size: '< 50 MB',
    resolution: '480p、720p | 300px ~ 6000px',
    duration: '2 ~ 15 秒',
    fps: '24 ~ 60 FPS',
  },
  Audio: {
    format: 'wav、mp3',
    ratio: '-',
    size: '< 15 MB',
    resolution: '-',
    duration: '2 ~ 15 秒',
    fps: '-',
  },
};

export function CyberUploadForm({ onUploadSuccess }: CyberUploadFormProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<'Image' | 'Video' | 'Audio'>('Image');
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // 新增：轮询进度状态
  const [pollAttempts, setPollAttempts] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const maxPollAttempts = 30;

  // 从 localStorage 监听 API Key 的变化
  useEffect(() => {
    const loadApiKey = () => {
      const savedKey = localStorage.getItem('wetoken_api_key');
      setApiKey(savedKey);
    };

    // 初始加载
    loadApiKey();

    // 监听 localStorage 变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wetoken_api_key') {
        loadApiKey();
      }
    };

    // 监听自定义事件（用于同一页面内的更新）
    const handleApiKeyUpdate = () => {
      loadApiKey();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('apiKeyUpdated', handleApiKeyUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('apiKeyUpdated', handleApiKeyUpdate);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setWorkflowStatus('uploading');

    try {
      // Step 1: Upload
      // 获取用户的 API Key
      if (!apiKey) {
        throw new Error('请先配置 API Key');
      }

      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name, assetType, apiKey }),
      });

      const data = await response.json();


      if (!response.ok) {
        throw new Error(data.error || '上传失败');
      }

      // Step 2: Processing
      setWorkflowStatus('processing');
      setPollAttempts(0);
      setElapsedTime(0);

      // 启动计时器
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      // 轮询查询状态
      const assetId = data.data.id;
      let attempts = 0;

      const pollStatus = async () => {
        attempts++;
        setPollAttempts(attempts);

        const statusResponse = await fetch(`/api/assets/${assetId}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey }),
        });
        const statusData = await statusResponse.json();

        if (statusData.success && statusData.data.status === 'Active') {
          clearInterval(timer);
          setWorkflowStatus('success');
          // 立即触发素材列表刷新
          onUploadSuccess();
          setTimeout(() => {
            setUrl('');
            setName('');
            setPollAttempts(0);
            setElapsedTime(0);
            setWorkflowStatus('idle');
          }, 500);
          return;
        }

        if (statusData.success && statusData.data.status === 'Failed') {
          clearInterval(timer);
          throw new Error('素材处理失败');
        }

        if (attempts < maxPollAttempts) {
          setTimeout(pollStatus, 10000); // 每 10 秒查询一次
        } else {
          clearInterval(timer);
          throw new Error('处理超时，请稍后在素材列表中查看状态');
        }
      };

      // 延迟 3 秒后开始轮询（给引擎一些处理时间）
      setTimeout(pollStatus, 3000);

    } catch (err) {
      setWorkflowStatus('failed');
      setErrorMessage(err instanceof Error ? err.message : '上传失败');
    }
  };

  const handleRetry = () => {
    setErrorMessage(null);
    setPollAttempts(0);
    setElapsedTime(0);
    setWorkflowStatus('idle');
  };

  const isProcessing = workflowStatus === 'uploading' || workflowStatus === 'processing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="cyber-card rounded-2xl p-6 relative overflow-hidden"
    >
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-cyan-500/20 to-transparent rotate-45 translate-x-14 -translate-y-14 pointer-events-none" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          className="relative"
          animate={isProcessing ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 20, repeat: isProcessing ? Infinity : 0, ease: 'linear' }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30">
            <Upload className="w-5 h-5 text-cyan-400" />
          </div>
        </motion.div>
        <div>
          <h2 className="text-xl font-bold neon-text">上传素材</h2>
          <p className="text-xs text-muted-foreground">Upload your assets</p>
        </div>
      </div>

      {/* Workflow Progress */}
      {workflowStatus !== 'idle' && (
        <WorkflowProgress
          status={workflowStatus}
          errorMessage={errorMessage ?? undefined}
          pollAttempts={pollAttempts}
          maxPollAttempts={maxPollAttempts}
          elapsedTime={elapsedTime}
        />
      )}

      {/* Upload Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* URL Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <Label className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            素材 URL
          </Label>
          <div className="relative group">
            <Input
              type="url"
              placeholder="https://example.com/asset.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={isProcessing}
              className="h-12 pl-4 rounded-xl text-sm"
            />
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-cyan-500/30" />
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            📡 请确保 URL 可公网访问，火山引擎会从该地址下载素材
          </p>
        </motion.div>

        {/* Name Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            素材名称
          </Label>
          <div className="relative group">
            <Input
              type="text"
              placeholder="我的炫酷素材"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isProcessing}
              className="h-12 pl-4 rounded-xl text-sm"
            />
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-cyan-500/30" />
          </div>
        </motion.div>

        {/* Asset Type */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <Label className="text-sm font-medium">素材类型</Label>
          <div className="grid grid-cols-3 gap-2">
            {assetTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = assetType === type.value;
              return (
                <motion.button
                  key={type.value}
                  type="button"
                  onClick={() => setAssetType(type.value)}
                  disabled={isProcessing}
                  className={`
                    relative p-3 rounded-xl border transition-all duration-300
                    ${isSelected 
                      ? 'border-cyan-500/50 bg-cyan-500/10' 
                      : 'border-border/50 bg-background/30 hover:border-cyan-500/30'
                    }
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  whileHover={isProcessing ? {} : { scale: 1.02 }}
                  whileTap={isProcessing ? {} : { scale: 0.98 }}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${type.color} bg-opacity-20`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium">{type.label}</span>
                  </div>
                  {isSelected && (
                    <motion.div
                      layoutId="selectedType"
                      className="absolute inset-0 rounded-xl border border-cyan-400"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Asset Type Restrictions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={assetType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="text-xs bg-muted/20 rounded-lg p-4 border border-muted-foreground/10 space-y-2 relative overflow-hidden"
          >
            {/* 跑马灯边框效果 */}
            <motion.div
              className="absolute inset-0 rounded-lg pointer-events-none"
              initial={false}
              animate={{
                boxShadow: [
                  'inset 0 0 0 0px transparent',
                  'inset 0 0 0 2px rgba(0, 245, 255, 0.5)',
                  'inset 0 0 0 2px rgba(191, 0, 255, 0.5)',
                  'inset 0 0 0 0px transparent',
                ],
              }}
              transition={{
                duration: 2,
                ease: 'linear',
                times: [0, 0.25, 0.75, 1],
              }}
            />

            <p className="font-medium text-cyan-400 mb-2 flex items-center gap-1.5 relative z-10">
              <Zap className="w-3.5 h-3.5" />
              {assetTypes.find(t => t.value === assetType)?.label}限制要求
            </p>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground/80 relative z-10">
              <div className="flex items-start gap-1.5">
                <span className="text-muted-foreground/50">格式:</span>
                <span className="font-medium">{assetTypeRestrictions[assetType].format}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-muted-foreground/50">大小:</span>
                <span className="font-medium">{assetTypeRestrictions[assetType].size}</span>
              </div>
              {assetTypeRestrictions[assetType].ratio !== '-' && (
                <div className="flex items-start gap-1.5">
                  <span className="text-muted-foreground/50">宽高比:</span>
                  <span className="font-medium">{assetTypeRestrictions[assetType].ratio}</span>
                </div>
              )}
              {assetTypeRestrictions[assetType].resolution !== '-' && (
                <div className="flex items-start gap-1.5">
                  <span className="text-muted-foreground/50">分辨率:</span>
                  <span className="font-medium">{assetTypeRestrictions[assetType].resolution}</span>
                </div>
              )}
              {assetTypeRestrictions[assetType].duration !== '-' && (
                <div className="flex items-start gap-1.5">
                  <span className="text-muted-foreground/50">时长:</span>
                  <span className="font-medium">{assetTypeRestrictions[assetType].duration}</span>
                </div>
              )}
              {assetTypeRestrictions[assetType].fps !== '-' && (
                <div className="flex items-start gap-1.5">
                  <span className="text-muted-foreground/50">帧率:</span>
                  <span className="font-medium">{assetTypeRestrictions[assetType].fps}</span>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-muted-foreground/10 relative z-10">
              <p className="text-muted-foreground/60">
                ⚠️ 请确保素材符合以上要求，否则可能导致上传失败或处理失败
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full h-12 cyber-button rounded-xl font-semibold text-sm relative overflow-hidden group text-white"
            onClick={() => {
              if (workflowStatus === 'failed') {
                handleRetry();
              }
            }}
          >
            {workflowStatus === 'success' ? (
              <div className="flex items-center gap-2 text-green-400">
                <Rocket className="w-4 h-4" />
                <span>上传成功！</span>
              </div>
            ) : workflowStatus === 'failed' ? (
              <div className="flex items-center gap-2 text-red-400">
                <Sparkles className="w-4 h-4" />
                <span>点击重试</span>
              </div>
            ) : isProcessing ? (
              <div className="flex items-center gap-2 text-white">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <span>处理中，请稍候...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-white">
                <span>立即上传</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </Button>
        </motion.div>
      </motion.form>

      {/* Decorative bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
    </motion.div>
  );
}
