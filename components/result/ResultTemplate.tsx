'use client';
import { useSceneStore } from '@/store/sceneStore';

export const ResultTemplate = () => {
  const setScene = useSceneStore((s) => s.setScene);
  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold text-yellow-300">✨ Result Template ✨</h1>
      <p className="text-gray-400 mt-2">(Foto, Cover Musik, Wish akan di sini)</p>
      
      {/* Tombol Kembali ke Scene 2 - POJOK KIRI BAWAH */}
      <button
        onClick={() => setScene('scene2')}
        className="absolute bottom-10 left-6 px-6 py-3 bg-white/10 rounded-full hover:bg-white/20 transition border border-white/20"
      >
        🔄 Kembali
      </button>
    </div>
  );
};
