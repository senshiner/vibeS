'use client';

import { useRef } from 'react';

interface DraggableCardProps {
  /** Posisi dalam persen dari ukuran wadah. */
  x: number;
  y: number;
  onMove: (x: number, y: number) => void;
  onDragEnd: () => void;
  label: string;
  /** Lebar kartu, default w-64. */
  widthClass?: string;
  children: React.ReactNode;
}

/**
 * Kartu yang bisa digeser dengan mouse maupun sentuhan.
 * Memakai Pointer Events, jadi satu kode untuk mouse dan touch.
 * Posisi disimpan dalam persen, supaya tetap masuk akal saat layar
 * diputar atau ukurannya berubah.
 */
export function DraggableCard({ x, y, onMove, onDragEnd, label, widthClass = 'w-64', children }: DraggableCardProps) {
  const dragRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    container: HTMLElement;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = e.currentTarget.parentElement;
    const card = e.currentTarget;
    if (!container) return;
    const cardRect = card.getBoundingClientRect();
    dragRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - cardRect.left,
      offsetY: e.clientY - cardRect.top,
      container,
    };
    card.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const rect = drag.container.getBoundingClientRect();
    const card = e.currentTarget;
    const cardWidth = card.offsetWidth;
    const cardHeight = card.offsetHeight;
    const leftPx = Math.max(0, Math.min(rect.width - cardWidth, e.clientX - rect.left - drag.offsetX));
    const topPx = Math.max(0, Math.min(rect.height - cardHeight, e.clientY - rect.top - drag.offsetY));
    onMove((leftPx / rect.width) * 100, (topPx / rect.height) * 100);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return;
    dragRef.current = null;
    onDragEnd();
  };

  return (
    <div
      role="group"
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`absolute z-20 ${widthClass} max-w-[80%] cursor-grab touch-none select-none active:cursor-grabbing`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {children}
    </div>
  );
}
