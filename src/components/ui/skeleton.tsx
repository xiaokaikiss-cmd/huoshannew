import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md",
        className
      )}
      {...props}
    >
      {/* 基础渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 via-slate-700/50 to-slate-800/50" />

      {/* 霓虹灯闪烁层 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-cyber-shimmer" />

      {/* 扫描线 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent animate-scan" />
      </div>

      {/* 边框光效 */}
      <div className="absolute inset-0 rounded-md border border-cyan-500/20 animate-pulse" />
    </div>
  )
}

// 科技风卡片加载骨架
function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-4 bg-slate-800/30 border border-slate-700/50",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        {/* 图片骨架 */}
        <Skeleton className="w-12 h-12 rounded-xl" />

        {/* 文字骨架 */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>

        {/* 按钮骨架 */}
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>

      {/* 扫描线 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan" />
      </div>
    </div>
  )
}

// 科技风列表加载骨架
function SkeletonList({ count = 3, className, ...props }: React.ComponentProps<"div"> & { count?: number }) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonList }
