'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { ZoomIn } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  RefreshCw,
  Image,
  Video,
  Music,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Sparkles,
  Copy,
  Timer,
  Trash2,
  Loader2,
  Check,
  X,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';

interface Asset {
  id: string;
  asset_id: string;
  name: string;
  url: string;
  asset_type: 'Image' | 'Video' | 'Audio';
  status: 'Active' | 'Processing' | 'Failed';
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  Active: {
    label: '已激活',
    icon: CheckCircle2,
    className: 'status-active',
  },
  Processing: {
    label: '处理中',
    icon: Clock,
    className: 'status-processing',
  },
  Failed: {
    label: '失败',
    icon: XCircle,
    className: 'status-failed',
  },
};

const assetTypeConfig = {
  Image: { label: '图片', icon: Image, gradient: 'from-cyan-500 to-blue-500' },
  Video: { label: '视频', icon: Video, gradient: 'from-purple-500 to-pink-500' },
  Audio: { label: '音频', icon: Music, gradient: 'from-green-500 to-emerald-500' },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
  exit: { 
    opacity: 0, 
    x: -100, 
    scale: 0.9,
    transition: { duration: 0.3 }
  },
};

interface CyberAssetListProps {
  refreshKey?: number;
}

export function CyberAssetList({ refreshKey }: CyberAssetListProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // 新增：是否正在刷新
  const [filterLoading, setFilterLoading] = useState(false); // 新增：筛选加载状态
  const [syncing, setSyncing] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [processingTimes, setProcessingTimes] = useState<Record<string, number>>({});

  // 批量选择相关状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);

  // 删除相关状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // 密码验证相关状态
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingDeleteAction, setPendingDeleteAction] = useState<(() => void) | null>(null);

  // 密码混淆（Base64 + 反转）
  // 原始密码: 20001030
  // 反转: 03010002
  // Base64: MDMwMTAwMDI=
  const encodedPassword = 'MDMwMTAwMDI=';

  // 图片预览相关状态
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewName, setPreviewName] = useState('');

  // 验证密码
  const verifyPassword = (input: string): boolean => {
    try {
      // 先反转输入的密码
      const reversed = input.split('').reverse().join('');
      // 再进行 Base64 编码
      const base64 = btoa(reversed);
      // 与混淆后的密码比较
      return base64 === encodedPassword;
    } catch {
      return false;
    }
  };

  // 搜索过滤相关状态
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Image' | 'Video' | 'Audio'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Processing' | 'Failed'>('all');
  const [showFilters, setShowFilters] = useState(true);

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [jumpToPage, setJumpToPage] = useState('');

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets', {
        cache: 'no-store', // 禁用浏览器缓存，确保获取最新数据
      });
      const data = await response.json();
      if (data.success) {
        setAssets(data.data);
      } else {
        toast.error(data.error || '获取素材列表失败');
      }
    } catch (error) {
      console.error('获取素材列表失败:', error);
      toast.error('网络错误，请检查网络连接');
    } finally {
      setLoading(false);
      setIsRefreshing(false); // 刷新完成
    }
  };

  const syncAllAssets = async () => {
    setSyncing(true);
    try {
      // 获取用户的 API Key
      const apiKey = localStorage.getItem('wetoken_api_key');
      if (!apiKey) {
        toast.error('请先配置 API Key');
        setSyncing(false);
        return;
      }

      const response = await fetch('/api/assets/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchAssets();
        toast.success('同步成功');
      } else {
        toast.error(data.error || '同步失败');
      }
    } catch (error) {
      console.error('同步失败:', error);
      toast.error('网络错误，同步失败');
    } finally {
      setSyncing(false);
    }
  };

  const syncSingleAsset = async (id: string) => {
    setSyncingId(id);
    try {
      // 获取用户的 API Key
      const apiKey = localStorage.getItem('wetoken_api_key');
      if (!apiKey) {
        toast.error('请先配置 API Key');
        return;
      }

      const response = await fetch(`/api/assets/${id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const data = await response.json();
      if (data.success) {
        setAssets((prev) =>
          prev.map((asset) => (asset.id === id ? data.data : asset))
        );
        toast.success('同步成功');
      } else {
        toast.error(data.error || '同步失败');
      }
    } catch (error) {
      console.error('同步失败:', error);
      toast.error('网络错误，同步失败');
    } finally {
      setSyncingId(null);
    }
  };

  const copyAssetId = async (assetId: string) => {
    try {
      // 尝试使用现代 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(assetId);
      } else {
        // 降级方案: 使用传统方法
        const textArea = document.createElement('textarea');
        textArea.value = assetId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('复制失败:', err);
          throw new Error('复制失败');
        } finally {
          document.body.removeChild(textArea);
        }
      }
      setCopiedId(assetId);
      toast.success('复制成功');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('复制失败:', error);
      toast.error('复制失败，请手动复制');
    }
  };

  // 打开删除确认对话框
  const openDeleteDialog = (asset: Asset) => {
    setPendingDeleteAction(() => () => {
      setAssetToDelete(asset);
      setDeleteDialogOpen(true);
    });
    setPasswordDialogOpen(true);
    setPassword('');
    setPasswordError('');
  };

  // 执行删除
  const confirmDelete = async () => {
    if (!assetToDelete) return;

    const id = assetToDelete.id;
    setDeletingIds((prev) => new Set(prev).add(id));
    setDeleteDialogOpen(false);

    try {
      const response = await fetch(`/api/assets/${id}/delete`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        // 延迟移除，让动画有时间播放
        setTimeout(() => {
          setAssets((prev) => prev.filter((asset) => asset.id !== id));
          setDeletingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 300);
        toast.success('删除成功');
      } else {
        toast.error(data.error || '删除失败');
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('网络错误，删除失败');
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // 批量选择/取消选择
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(paginatedAssets.map((a) => a.id)));
      setSelectAll(true);
    }
  };

  // 切换单个素材的选择状态
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // 检查当前页是否全选
      const allCurrentPageSelected = paginatedAssets.every((a) => next.has(a.id));
      setSelectAll(allCurrentPageSelected);
      return next;
    });
  };

  // 处理密码验证
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPassword(password)) {
      setPasswordDialogOpen(false);
      setPassword('');
      setPasswordError('');
      if (pendingDeleteAction) {
        pendingDeleteAction();
        setPendingDeleteAction(null);
      }
    } else {
      setPasswordError('密码错误');
    }
  };

  // 批量同步
  const batchSync = async () => {
    if (selectedIds.size === 0) {
      toast.error('请先选择要同步的素材');
      return;
    }

    setSyncing(true);
    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/assets/${id}/sync`, { method: 'POST' })
      );
      await Promise.all(promises);
      await fetchAssets();
      setSelectedIds(new Set());
      setSelectAll(false);
      toast.success(`成功同步 ${selectedIds.size} 个素材`);
    } catch (error) {
      console.error('批量同步失败:', error);
      toast.error('批量同步失败');
    } finally {
      setSyncing(false);
    }
  };

  // 批量删除
  const confirmBatchDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('请先选择要删除的素材');
      return;
    }

    setPendingDeleteAction(() => async () => {
      setDeletingIds(selectedIds);
      setBatchDeleteDialogOpen(false);

      try {
        const deletePromises = Array.from(selectedIds).map(async (id) => {
          try {
            const response = await fetch(`/api/assets/${id}/delete`, { method: 'DELETE' });
            const data = await response.json();
            return { id, success: data.success };
          } catch (error) {
            console.error(`删除素材 ${id} 失败:`, error);
            return { id, success: false };
          }
        });

        const results = await Promise.all(deletePromises);
        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        setTimeout(() => {
          if (successCount > 0) {
            // 只移除成功删除的素材
            const successIds = results.filter(r => r.success).map(r => r.id);
            setAssets((prev) => prev.filter((asset) => !successIds.includes(asset.id)));
          }
          setDeletingIds(new Set());
          setSelectedIds(new Set());
          setSelectAll(false);

          if (failedCount === 0) {
            toast.success(`成功删除 ${successCount} 个素材`);
          } else if (successCount === 0) {
            toast.error('批量删除失败，请稍后重试');
          } else {
            toast.warning(`成功删除 ${successCount} 个素材，${failedCount} 个失败`);
          }
        }, 300);
      } catch (error) {
        console.error('批量删除失败:', error);
        toast.error('批量删除失败');
        setDeletingIds(new Set());
      }
    });

    setPasswordDialogOpen(true);
    setPassword('');
    setPasswordError('');
  };

  useEffect(() => {
    // 如果有 refreshKey 且不是初始加载，则设置为刷新状态
    if (refreshKey && refreshKey > 0) {
      setIsRefreshing(true);
    }
    fetchAssets();
  }, [refreshKey]);

  // Calculate processing time
  useEffect(() => {
    const processingAssets = assets.filter(a => a.status === 'Processing');
    if (processingAssets.length === 0) {
      setProcessingTimes({});
      return;
    }

    const times: Record<string, number> = {};
    processingAssets.forEach(asset => {
      const createdAt = new Date(asset.created_at).getTime();
      const elapsed = Math.floor((Date.now() - createdAt) / 1000);
      times[asset.id] = elapsed;
    });
    setProcessingTimes(times);

    const interval = setInterval(() => {
      setProcessingTimes(prev => {
        const updated: Record<string, number> = {};
        Object.keys(prev).forEach(id => {
          updated[id] = prev[id] + 1;
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [assets]);

  // Auto-sync processing assets
  useEffect(() => {
    const hasProcessing = assets.some((a) => a.status === 'Processing');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      syncAllAssets();
    }, 10000);

    return () => clearInterval(interval);
  }, [assets.filter(a => a.status === 'Processing').length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProcessingPercentage = (seconds: number) => {
    return Math.min((seconds / 30) * 100, 95);
  };

  // 过滤素材
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.asset_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || asset.asset_type === filterType;
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // 分页
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 重置到第一页当过滤条件或每页数量改变时
  useEffect(() => {
    setFilterLoading(true);
    setCurrentPage(1);
    // 200ms 后移除加载状态，让筛选更流畅
    setTimeout(() => {
      setFilterLoading(false);
    }, 200);
  }, [searchQuery, filterType, filterStatus, itemsPerPage]);

  // 跳转到指定页
  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setJumpToPage('');
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>

        {/* Search Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Decorative bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden"
      >
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-purple-500/20 to-transparent rotate-45 translate-x-14 -translate-y-14 pointer-events-none" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
            </motion.div>
            <div>
              <h2 className="text-xl font-bold neon-text">素材库</h2>
              <p className="text-xs text-muted-foreground">
                {assets.length} 个素材
                {filteredAssets.length !== assets.length && (
                  <span className="text-cyan-400 ml-2">
                    · {filteredAssets.length} 个符合条件
                  </span>
                )}
                {assets.filter(a => a.status === 'Processing').length > 0 && (
                  <span className="text-cyan-400 ml-2">
                    · {assets.filter(a => a.status === 'Processing').length} 个处理中
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9 px-3 rounded-lg border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
            >
              <Filter className="w-4 h-4 mr-1" />
              <span className="text-xs">筛选</span>
            </Button>
            {selectedIds.size > 0 ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={batchSync}
                  disabled={syncing}
                  className="h-9 px-3 rounded-lg border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                  <span className="text-xs">同步 ({selectedIds.size})</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBatchDeleteDialogOpen(true)}
                  disabled={syncing}
                  className="h-9 px-3 rounded-lg border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  <span className="text-xs">删除 ({selectedIds.size})</span>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={syncAllAssets}
                disabled={syncing}
                className="h-9 px-3 rounded-lg border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                <span className="text-xs">同步</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索素材名称或 ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-800/30 border border-slate-700/30 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/30 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3" style={{ display: showFilters ? 'grid' : 'none' }}>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Image className="w-3 h-3 text-purple-400" />
                    素材类型
                  </label>
                  <Select value={filterType} onValueChange={(value) => setFilterType(value as typeof filterType)}>
                    <SelectTrigger className="w-full h-10 bg-slate-800/50 border-slate-700/50 text-slate-200 focus:border-cyan-500/50">
                      <SelectValue placeholder="全部类型" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800/95 border-slate-700/50">
                      <SelectItem value="all" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">全部类型</SelectItem>
                      <SelectItem value="Image" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">图片</SelectItem>
                      <SelectItem value="Video" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">视频</SelectItem>
                      <SelectItem value="Audio" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">音频</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    素材状态
                  </label>
                  <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
                    <SelectTrigger className="w-full h-10 bg-slate-800/50 border-slate-700/50 text-slate-200 focus:border-cyan-500/50" style={{ minWidth: '100%' }}>
                      <SelectValue placeholder="全部状态" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800/95 border-slate-700/50">
                      <SelectItem value="all" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">全部状态</SelectItem>
                      <SelectItem value="Active" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">已激活</SelectItem>
                      <SelectItem value="Processing" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">处理中</SelectItem>
                      <SelectItem value="Failed" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">失败</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

          {/* Clear Filters */}
          {(searchQuery || filterType !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterStatus('all');
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              清除筛选条件
            </button>
          )}
        </div>

        {/* 批量操作工具栏 */}
        {filteredAssets.length > 0 && paginatedAssets.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between mb-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30"
          >
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectAll}
                onCheckedChange={toggleSelectAll}
                className="border-slate-600 flex-shrink-0"
              />
              <span className="text-sm text-muted-foreground">
                {selectedIds.size === 0
                  ? '全选'
                  : `已选 ${selectedIds.size} 个`}
              </span>
            </div>
            {selectedIds.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedIds(new Set());
                  setSelectAll(false);
                }}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                取消选择
              </Button>
            )}
          </motion.div>
        )}

        {/* Asset List */}
        <div className="min-h-[500px]">
          {filterLoading ? (
            <div className="flex items-center justify-center h-[500px]">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <AnimatePresence>
              {paginatedAssets.length === 0 ? (
              filteredAssets.length === 0 ? (
                <motion.div
                  key="empty"
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="h-[500px] flex flex-col items-center justify-center relative"
                >
                {/* 动态背景粒子 */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full bg-cyan-500/20 blur-xl"
                      style={{
                        width: `${Math.random() * 100 + 50}px`,
                        height: `${Math.random() * 100 + 50}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        y: [0, -30, 0],
                        opacity: [0.2, 0.5, 0.2],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>

                {/* 主图标容器 */}
                <motion.div
                  className="relative mx-auto mb-6"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  {/* 外层光晕 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 blur-2xl rounded-full animate-pulse" />

                  {/* 主图标圆圈 */}
                  <motion.div
                    className="relative w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center"
                    whileHover={{ scale: 1.05, rotate: 10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    {/* 内部扫描线效果 */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.3, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                    </motion.div>

                    {/* 图标 */}
                    <Image className="w-10 h-10 text-cyan-400 relative z-10" />
                  </motion.div>

                  {/* 环绕的卫星元素 */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{
                        width: '140px',
                        height: '140px',
                        transform: `rotate(${i * 120}deg)`,
                      }}
                    >
                      <motion.div
                        className="absolute w-3 h-3 rounded-full"
                        style={{
                          background: i === 0 ? '#00f5ff' : i === 1 ? '#bf00ff' : '#ff00ff',
                          boxShadow: `0 0 10px ${i === 0 ? '#00f5ff' : i === 1 ? '#bf00ff' : '#ff00ff'}`,
                        }}
                        animate={{
                          x: [0, 0],
                          y: [-70, -70],
                        }}
                        transition={{
                          duration: 4 + i * 0.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {/* 标题 */}
                <motion.h3
                  className="text-2xl font-bold mb-3 neon-text relative z-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  暂无素材
                </motion.h3>

                {/* 描述文字 */}
                <motion.p
                  className="text-sm text-muted-foreground mb-6 relative z-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  上传你的第一个素材，开始创建精彩内容
                </motion.p>

                {/* 底部提示 */}
                <motion.div
                  className="mt-8 text-xs text-muted-foreground/50 relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p>支持图片、视频和音频格式</p>
                  <p className="mt-1">最大文件大小：图片 30MB · 视频 50MB · 音频 15MB</p>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center py-16">
                  <Search className="w-8 h-8 text-slate-500/50 mx-auto mb-2" />
                  <p className="text-muted-foreground mb-1">没有找到匹配的素材</p>
                  <p className="text-xs text-muted-foreground/50">试试调整筛选条件</p>
                </div>
              </motion.div>
            )) : (
              <motion.div
                key="assets"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-3"
              >
                {paginatedAssets.map((asset) => {
                  const status = statusConfig[asset.status];
                  const type = assetTypeConfig[asset.asset_type];
                const StatusIcon = status.icon;
                const TypeIcon = type.icon;
                const processingTime = processingTimes[asset.id] || 0;
                const isDeleting = deletingIds.has(asset.id);

                return (
                  <motion.div
                    key={asset.id}
                    variants={item}
                    layout
                    className={`relative transition-opacity ${isDeleting ? 'opacity-50' : ''}`}
                  >
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 hover:border-cyan-500/30 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedIds.has(asset.id)}
                          onCheckedChange={() => toggleSelect(asset.id)}
                          disabled={isDeleting}
                          className="border-slate-600 flex-shrink-0"
                        />

                        {/* Type Icon / Preview */}
                        {asset.asset_type === 'Image' && asset.status === 'Active' ? (
                          <div
                            className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg cursor-pointer hover:ring-2 hover:ring-cyan-500/50 transition-all"
                            onClick={() => {
                              setPreviewUrl(asset.url);
                              setPreviewName(asset.name);
                              setPreviewOpen(true);
                            }}
                          >
                            <img
                              src={asset.url}
                              alt={asset.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center flex-shrink-0 shadow-lg ${asset.asset_type === 'Image' ? 'cursor-pointer hover:ring-2 hover:ring-cyan-500/50' : ''}`}
                            onClick={() => {
                              if (asset.asset_type === 'Image') {
                                setPreviewUrl(asset.url);
                                setPreviewName(asset.name);
                                setPreviewOpen(true);
                              }
                            }}
                          >
                            <TypeIcon className="w-6 h-6 text-white" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">
                              {asset.name}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                            >
                              <StatusIcon className="w-3 h-3 inline mr-1" />
                              {status.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-mono truncate max-w-[150px]">{asset.asset_id}</span>
                            <span>•</span>
                            <span>
                              {new Date(asset.created_at).toLocaleString('zh-CN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {/* Processing Progress */}
                          {asset.status === 'Processing' && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
                                <Timer className="w-3 h-3" />
                                <span>已处理 {formatTime(processingTime)}</span>
                              </div>
                              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                                  initial={{ width: '0%' }}
                                  animate={{ width: `${getProcessingPercentage(processingTime)}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyAssetId(asset.asset_id);
                            }}
                            disabled={isDeleting}
                            className="p-2 rounded-lg hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                            title="复制素材 ID"
                          >
                            {copiedId === asset.asset_id ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(asset.url, '_blank');
                            }}
                            disabled={isDeleting}
                            className="p-2 rounded-lg hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                            title="查看源文件"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                          </button>

                          {asset.status === 'Processing' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                syncSingleAsset(asset.id);
                              }}
                              disabled={isDeleting}
                              className="h-7 px-2 rounded-lg border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 text-xs"
                            >
                              <RefreshCw className={`w-3 h-3 mr-1 ${syncingId === asset.id ? 'animate-spin' : ''}`} />
                              <span>同步</span>
                            </Button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(asset);
                            }}
                            disabled={isDeleting}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title="删除素材"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
            </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>

        {/* Pagination */}
        {filteredAssets.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-4 border-t border-slate-700/30">
            {/* 每页数量选择器 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">每页</span>
              <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-20 h-8 bg-slate-800/50 border-slate-700/50 text-slate-200 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800/95 border-slate-700/50">
                  <SelectItem value="10" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400 text-xs">10 条</SelectItem>
                  <SelectItem value="20" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400 text-xs">20 条</SelectItem>
                  <SelectItem value="50" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400 text-xs">50 条</SelectItem>
                  <SelectItem value="100" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400 text-xs">100 条</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                共 {filteredAssets.length} 个
              </span>
            </div>

            {/* 分页导航 */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {/* 首页 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 px-2 rounded-lg border-slate-700/50 hover:bg-slate-700/30 text-xs"
                  title="首页"
                >
                  首页
                </Button>

                {/* 上一页 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2 rounded-lg border-slate-700/50 hover:bg-slate-700/30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* 页码 */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'text-muted-foreground hover:bg-slate-700/30'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* 下一页 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2 rounded-lg border-slate-700/50 hover:bg-slate-700/30"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* 末页 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2 rounded-lg border-slate-700/50 hover:bg-slate-700/30 text-xs"
                  title="末页"
                >
                  末页
                </Button>

                {/* 跳转 */}
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-xs text-muted-foreground">跳至</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpToPage}
                    onChange={(e) => setJumpToPage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                    placeholder="页码"
                    className="w-14 h-8 px-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-200 text-xs text-center focus:outline-none focus:border-cyan-500/50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleJumpToPage}
                    className="h-8 px-2 rounded-lg border-slate-700/50 hover:bg-slate-700/30 text-xs"
                  >
                    GO
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Decorative bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">确认删除</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              确定要删除素材 <span className="text-cyan-400 font-medium">「{assetToDelete?.name}」</span> 吗？
              <br />
              <span className="text-xs text-slate-500 mt-1 block">此操作无法撤销</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500/80 hover:bg-red-500 text-white"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">批量删除</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              确定要删除选中的 <span className="text-cyan-400 font-medium">{selectedIds.size}</span> 个素材吗？
              <br />
              <span className="text-xs text-slate-500 mt-1 block">此操作无法撤销</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchDelete}
              className="bg-red-500/80 hover:bg-red-500 text-white"
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Verification Dialog */}
      <AlertDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 sm:max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              密码验证
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              请输入删除密码以确认操作
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handlePasswordSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-200">密码</Label>
                <Input
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-sm text-red-400">{passwordError}</p>
                )}
              </div>
            </div>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                取消
              </AlertDialogCancel>
              <Button
                type="submit"
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
              >
                确认
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="bg-slate-900/95 border-slate-700 p-0 max-w-[90vw] max-h-[90vh] flex flex-col">
          <DialogTitle className="sr-only">
            {previewName}
          </DialogTitle>
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-slate-200 font-medium truncate max-w-[300px]">{previewName}</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
            <img
              src={previewUrl}
              alt={previewName}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
