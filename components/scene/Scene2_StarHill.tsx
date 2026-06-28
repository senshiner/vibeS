'use client';

import { useSceneStore } from '@/store/sceneStore';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarBackground } from './StarBackground';
import { MusicPickerSheet } from '@/components/popup/MusicPickerSheet';

export const Scene2_StarHill = () => {
  const setScene = useSceneStore((s) => s.setScene);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const openSheet = (name: string) => setActiveSheet(name);
  const closeSheet = () => setActiveSheet(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: 'easeOut',
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3, ease: 'easeIn' },
    },
  };

  return (
    <motion.div
      className="relative w-full h-full overflow-hidden text-white select-none"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Background */}
      <motion.div
        className="absolute inset-0 z-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/scene2-bg.jpg)',
          backgroundColor: '#0b152d',
        }}
        variants={itemVariants}
      />

      {/* Bintang & Meteor */}
      <motion.div
        className="absolute inset-0 z-5 pointer-events-none"
        variants={itemVariants}
      >
        <StarBackground />
      </motion.div>

      {/* 4 Tombol Utama dengan AnimatePresence */}
      <AnimatePresence>
        {!activeSheet && (
          <motion.div
            className="absolute bottom-[15%] left-1/2 -translate-x-1/2 z-20 flex items-center gap-4"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {['ai', 'music', 'photo', 'wish'].map((id) => (
              <motion.button
                key={id}
                onClick={() => openSheet(id)}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-neutral-900/40 border border-neutral-700/30 backdrop-blur-md flex items-center justify-center hover:bg-neutral-800/60 hover:scale-105 active:scale-95 transition-all duration-300 text-xl shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="opacity-80 hover:opacity-100">
                  {id === 'ai' && '🤖'}
                  {id === 'music' && '🎵'}
                  {id === 'photo' && '📷'}
                  {id === 'wish' && '💌'}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tombol Result (tetap terlihat, tidak ikut animasi) */}
      <motion.div
        className="absolute bottom-6 right-6 z-20"
        variants={buttonVariants}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <button
          onClick={() => setScene('result')}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/40 backdrop-blur-md flex items-center justify-center text-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-300"
        >
          <span className="text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]">✨</span>
        </button>
      </motion.div>

      {/* Bottom Sheet dengan animasi */}
      <AnimatePresence>
        {activeSheet === 'music' && <MusicPickerSheet onClose={closeSheet} />}
        {activeSheet && activeSheet !== 'music' && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-30 bg-[#070d19]/90 backdrop-blur-xl rounded-t-3xl border-t border-white/10 p-6 max-h-[60vh] overflow-y-auto shadow-[0_-15px_30px_rgba(0,0,0,0.5)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-6 opacity-40" />
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium tracking-wide capitalize">
                {activeSheet} Menu
              </h2>
              <button
                onClick={closeSheet}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
            <p className="text-sm text-gray-400 leading-relaxed">
              Content placeholder untuk <strong>{activeSheet}</strong>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
