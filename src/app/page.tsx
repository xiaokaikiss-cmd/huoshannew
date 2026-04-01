'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
const CyberUploadForm = dynamic(() => import('@/components/cyber-upload-form').then(mod => ({ default: mod.CyberUploadForm })), {
  ssr: true,
  loading: () => (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
      <div className="h-6 w-32 mb-4 bg-slate-800/50 rounded animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-slate-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  ),
});

const CyberAssetList = dynamic(() => import('@/components/cyber-asset-list').then(mod => ({ default: mod.CyberAssetList })), {
  ssr: true,
  loading: () => (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-32 bg-slate-800/50 rounded animate-pulse" />
        <div className="h-9 w-24 bg-slate-800/50 rounded-lg animate-pulse" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  ),
});

const AssetHostingGuide = dynamic(() => import('@/components/asset-hosting-guide').then(mod => ({ default: mod.AssetHostingGuide })), {
  ssr: true,
});

const BackgroundEffects = dynamic(() => import('@/components/scan-line').then(mod => ({
  default: () => (
    <>
      <mod.ScanLine />
      <mod.GlowingOrbs />
      <mod.GridBackground />
    </>
  )
})), {
  ssr: false,
});

import { Sparkles, Zap, Database } from 'lucide-react';
import { ApiKeySettings, getApiKey } from '@/components/api-key-settings';
import { SuggestionBox } from '@/components/suggestion-box';

// Dynamic import for particle background to avoid SSR issues
const ParticleBackground = dynamic(
  () => import('@/components/particle-background').then(mod => mod.ParticleBackground),
  { ssr: false }
);

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <ParticleBackground />
      <BackgroundEffects />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Header */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-12 text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="inline-flex items-center justify-center mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-cyan-500 to-purple-500 opacity-50 animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-10 h-10 text-cyan-400" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-3 text-4xl md:text-5xl font-bold mb-4 tracking-tight"
          >
            <span className="neon-text">邪修虚拟人</span>
            <span className="text-foreground text-3xl md:text-4xl font-medium">素材管理系统</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            上传和管理虚拟人素材，支持图片、视频和音频
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-8 mt-8"
          >
            {[
              { icon: Zap, label: '极速上传', color: 'text-cyan-400' },
              { icon: Database, label: '本地存储', color: 'text-purple-400' },
              { icon: Sparkles, label: '智能同步', color: 'text-pink-400' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-2"
              >
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* API Key Settings Button & Suggestion Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center gap-3 mt-4"
          >
            <ApiKeySettings />
            <SuggestionBox />
          </motion.div>
        </motion.header>

        {/* Main Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid gap-6 lg:grid-cols-[400px_1fr]"
        >
          {/* Left: Upload Form & Guide */}
          <div className="flex flex-col">
            <CyberUploadForm onUploadSuccess={handleUploadSuccess} />
            <div className="mt-4">
              <AssetHostingGuide />
            </div>
          </div>

          {/* Right: Asset List */}
          <div>
            <CyberAssetList key={refreshKey} />
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center text-xs text-muted-foreground/50"
        >
          <p>Powered by Next.js • Supabase • Framer Motion</p>
        </motion.footer>
      </div>

      {/* Vignette Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-5"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(5, 5, 10, 0.5) 100%)',
        }}
      />
    </div>
  );
}
