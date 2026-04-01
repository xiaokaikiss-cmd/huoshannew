"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Image,
  Video,
  Music,
  Upload,
  ChevronDown,
  ChevronUp,
  Link2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// 图床平台配置 - 精简版
const HOSTING_PLATFORMS = {
  image: [
    {
      name: "ImgBB",
      url: "https://imgbb.com/",
      maxSize: "32 MB",
      highlight: "永久存储 · 无需注册",
      recommended: true,
    },
    {
      name: "PostImage",
      url: "https://postimages.org/",
      maxSize: "24 MB",
      highlight: "永久存储 · 无需注册",
      recommended: true,
    },
    {
      name: "img.scdn.io",
      url: "https://img.scdn.io/",
      maxSize: "10 MB",
      highlight: "自动 WebP 优化 · 多 CDN 线路",
      recommended: true,
    },
  ],
  video: [
    {
      name: "Catbox",
      url: "https://catbox.moe/",
      maxSize: "200 MB",
      highlight: "永久存储 · 无需注册 · 支持视频/音频",
      recommended: true,
    },
  ],
  audio: [
    {
      name: "Catbox",
      url: "https://catbox.moe/",
      maxSize: "200 MB",
      highlight: "永久存储 · 无需注册",
      recommended: true,
    },
  ],
};

// 素材类型配置
const ASSET_TYPES = [
  { key: "image", name: "图片", icon: Image, formats: "JPG / PNG / GIF / WebP" },
  { key: "video", name: "视频", icon: Video, formats: "MP4 / WebM / MOV" },
  { key: "audio", name: "音频", icon: Music, formats: "MP3 / WAV / OGG" },
] as const;

// 简化步骤
const STEPS = [
  { icon: Upload, text: "上传到图床" },
  { icon: Link2, text: "获取直链" },
  { icon: CheckCircle2, text: "粘贴提交" },
];

type AssetType = typeof ASSET_TYPES[number]["key"];

export function AssetHostingGuide() {
  const [activeType, setActiveType] = useState<AssetType>("image");
  const [isOpen, setIsOpen] = useState(false);

  const platforms = HOSTING_PLATFORMS[activeType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* 展开按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 px-4",
          "rounded-xl text-sm transition-all duration-300",
          "bg-slate-800/30 hover:bg-slate-800/50",
          "border border-slate-700/50 hover:border-cyan-500/30",
          "text-slate-400 hover:text-cyan-400"
        )}
      >
        <Upload className="h-4 w-4" />
        <span>{isOpen ? "收起引导" : "没有素材URL？查看图床上传引导"}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 ml-1" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-1" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-6">
              {/* 简化步骤指示 */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                {STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <step.icon className="h-3.5 w-3.5 text-cyan-500" />
                      <span>{step.text}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <span className="text-slate-600">→</span>
                    )}
                  </div>
                ))}
              </div>

              {/* 类型选择 + 平台列表 */}
              <div className="space-y-4">
                {/* 类型切换 */}
                <div className="flex items-center justify-center gap-1 p-1 bg-slate-800/30 rounded-lg w-fit mx-auto">
                  {ASSET_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isActive = activeType === type.key;
                    return (
                      <button
                        key={type.key}
                        onClick={() => setActiveType(type.key)}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 rounded-md text-sm transition-all",
                          isActive
                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                            : "text-slate-400 hover:text-slate-300"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {type.name}
                      </button>
                    );
                  })}
                </div>

                {/* 支持格式 */}
                <p className="text-center text-xs text-slate-500">
                  支持格式：{ASSET_TYPES.find((t) => t.key === activeType)?.formats}
                </p>

                {/* 平台卡片 - 单列布局更透气 */}
                <div className="space-y-3 max-w-md mx-auto">
                  {platforms.map((platform, index) => (
                    <motion.div
                      key={platform.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex items-center justify-between gap-4 p-4 rounded-xl",
                        "bg-slate-800/20 border border-slate-700/30",
                        platform.recommended && "border-cyan-500/20 bg-cyan-500/5"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-200">
                            {platform.name}
                          </span>
                          {platform.recommended && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 border-cyan-500/40 text-cyan-400"
                            >
                              推荐
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {platform.maxSize} · {platform.highlight}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        asChild
                        className={cn(
                          "shrink-0 h-8 text-xs",
                          platform.recommended
                            ? "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
                            : "bg-slate-700/50 hover:bg-slate-700 text-slate-300"
                        )}
                      >
                        <a
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          前往
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 提示 */}
              <p className="text-center text-xs text-slate-500">
                💡 上传后请复制 <span className="text-cyan-400">直链地址</span>（以图片格式结尾的URL）
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
