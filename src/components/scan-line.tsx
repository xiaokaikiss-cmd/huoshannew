'use client';

import { motion } from 'framer-motion';

export function ScanLine() {
  return (
    <motion.div
      className="fixed left-0 right-0 h-px pointer-events-none z-50"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.5), transparent)',
        boxShadow: '0 0 20px rgba(0, 245, 255, 0.3)',
      }}
      initial={{ top: '-10%' }}
      animate={{ top: '110%' }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

export function GlowingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Top left orb */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 245, 255, 0.15), transparent 70%)',
          filter: 'blur(60px)',
        }}
        initial={{ top: '-10%', left: '-10%' }}
        animate={{
          top: [' -10%', '20%', '-10%'],
          left: ['-10%', '10%', '-10%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Bottom right orb */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(191, 0, 255, 0.12), transparent 70%)',
          filter: 'blur(80px)',
        }}
        initial={{ bottom: '-20%', right: '-20%' }}
        animate={{
          bottom: ['-20%', '-5%', '-20%'],
          right: ['-20%', '-10%', '-20%'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Center orb */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 102, 255, 0.1), transparent 70%)',
          filter: 'blur(50px)',
        }}
        initial={{ top: '40%', left: '40%' }}
        animate={{
          top: ['40%', '50%', '40%'],
          left: ['40%', '45%', '40%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

export function GridBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0, 245, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 245, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black, transparent)',
      }}
    />
  );
}
