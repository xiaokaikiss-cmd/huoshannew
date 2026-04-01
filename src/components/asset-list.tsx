'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  Image,
  Video,
  Music,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
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
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  Processing: {
    label: '处理中',
    icon: Clock,
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  },
  Failed: {
    label: '失败',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

const assetTypeConfig = {
  Image: { label: '图片', icon: Image },
  Video: { label: '视频', icon: Video },
  Audio: { label: '音频', icon: Music },
};

export function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      const data = await response.json();

      if (data.success) {
        setAssets(data.data);
      }
    } catch (error) {
      console.error('获取素材列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncAllAssets = async () => {
    setSyncing(true);
    try {
      await fetch('/api/assets/sync-all', { method: 'POST' });
      await fetchAssets();
    } catch (error) {
      console.error('同步失败:', error);
    } finally {
      setSyncing(false);
    }
  };

  const syncSingleAsset = async (id: string) => {
    try {
      const response = await fetch(`/api/assets/${id}/sync`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        // 更新列表中的单个项
        setAssets((prev) =>
          prev.map((asset) =>
            asset.id === id ? data.data : asset
          )
        );
      }
    } catch (error) {
      console.error('同步失败:', error);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // 自动轮询处理中的素材
  useEffect(() => {
    const hasProcessing = assets.some((a) => a.status === 'Processing');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      syncAllAssets();
    }, 10000); // 每 10 秒同步一次

    return () => clearInterval(interval);
  }, [assets]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>素材列表</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={syncAllAssets}
            disabled={syncing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`}
            />
            同步状态
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            暂无素材，请先上传
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => {
                const status = statusConfig[asset.status];
                const type = assetTypeConfig[asset.asset_type];
                const StatusIcon = status.icon;
                const TypeIcon = type.icon;

                return (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={status.className}
                      >
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(asset.created_at).toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {asset.status === 'Processing' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => syncSingleAsset(asset.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
