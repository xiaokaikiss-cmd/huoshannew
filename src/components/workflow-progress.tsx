'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, XCircle, ArrowRight, CloudUpload, Server, Sparkles, CheckCircle, Timer, RefreshCw } from 'lucide-react';

export type WorkflowStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'failed';

interface WorkflowProgressProps {
  status: WorkflowStatus;
  errorMessage?: string;
  // 新增：轮询进度信息
  pollAttempts?: number;
  maxPollAttempts?: number;
  elapsedTime?: number; // 秒
}

const steps = [
  { key: 'upload', label: '上传素材', icon: CloudUpload },
  { key: 'submit', label: '提交处理', icon: Server },
  { key: 'process', label: '引擎处理', icon: Sparkles },
  { key: 'complete', label: '完成激活', icon: CheckCircle },
];

export function WorkflowProgress({ status, errorMessage, pollAttempts = 0, maxPollAttempts = 30, elapsedTime = 0 }: WorkflowProgressProps) {
  const getCurrentStep = () => {
    switch (status) {
      case 'idle': return -1;
      case 'uploading': return 0;
      case 'processing': return 2;
      case 'success': return 4;
      case 'failed': return -2;
      default: return -1;
    }
  };

  const currentStep = getCurrentStep();

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="cyber-card rounded-xl p-4 mb-4"
    >
      {/* Workflow Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">处理进度</span>
        <StatusBadge status={status} errorMessage={errorMessage} />
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;
          const isPending = currentStep < index;

          return (
            <div key={step.key} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <motion.div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center relative
                    ${isCompleted ? 'bg-green-500/20 border border-green-500/50' : ''}
                    ${isCurrent ? 'bg-cyan-500/20 border border-cyan-500/50' : ''}
                    ${isPending ? 'bg-muted/30 border border-muted-foreground/20' : ''}
                    ${status === 'failed' && isCurrent ? 'bg-red-500/20 border border-red-500/50' : ''}
                  `}
                  animate={isCurrent && status !== 'failed' ? {
                    boxShadow: [
                      '0 0 0 0 rgba(0, 245, 255, 0.4)',
                      '0 0 0 10px rgba(0, 245, 255, 0)',
                    ],
                  } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : isCurrent && status === 'failed' ? (
                    <XCircle className="w-5 h-5 text-red-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  ) : (
                    <StepIcon className={`w-5 h-5 ${isPending ? 'text-muted-foreground/50' : 'text-foreground'}`} />
                  )}
                </motion.div>
                <span className={`text-xs mt-2 text-center whitespace-nowrap ${isCurrent ? 'text-cyan-400 font-medium' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 relative overflow-hidden">
                  <div 
                    className={`absolute inset-0 transition-colors duration-300 ${
                      isCompleted ? 'bg-green-500/50' : 'bg-muted-foreground/20'
                    }`}
                  />
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-cyan-500"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Details - 仅在处理中显示 */}
      {status === 'processing' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
        >
          {/* 已处理时间 + 轮询次数 */}
          <div className="flex items-center justify-between">
            {/* 已处理时间 */}
            <div className="flex items-center gap-2">
              <Timer className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs text-muted-foreground">已处理</span>
              <span className="text-sm font-mono text-cyan-400">{formatTime(elapsedTime)}</span>
            </div>

            {/* 轮询次数 */}
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: '2s' }} />
              <span className="text-xs text-muted-foreground">轮询</span>
              <span className="text-sm font-mono">
                <span className="text-purple-400">{pollAttempts}</span>
                <span className="text-muted-foreground">/{maxPollAttempts}</span>
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {status === 'failed' && errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-2 rounded-lg"
        >
          错误：{errorMessage}
        </motion.div>
      )}
    </motion.div>
  );
}

function StatusBadge({ status, errorMessage }: { status: WorkflowStatus; errorMessage?: string }) {
  const config = {
    idle: { label: '等待上传', color: 'text-muted-foreground', bg: 'bg-muted/20' },
    uploading: { label: '上传中...', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    processing: { label: '处理中...', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    success: { label: '完成！', color: 'text-green-400', bg: 'bg-green-500/10' },
    failed: { label: '失败', color: 'text-red-400', bg: 'bg-red-500/10' },
  };

  const { label, color, bg } = config[status];

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${color} ${bg}`}>
      {label}
    </span>
  );
}
