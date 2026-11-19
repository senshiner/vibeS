'use client';

import { useEffect, useRef, useState } from 'react';
import { BREATH_CYCLES, BREATH_PHASES } from '@/lib/companion';

/**
 * Latihan napas terpandu: tarik 4 detik, tahan 4 detik, buang 6 detik,
 * diulang empat putaran. Lingkaran membesar saat menarik napas dan
 * mengecil saat membuang, mengikuti durasi tiap fase.
 */
export function BreathingExercise() {
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(BREATH_PHASES[0].seconds);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRunning(false);
  };

  useEffect(() => stop, []);

  const start = () => {
    stop();
    setCycle(1);
    setPhaseIndex(0);
    setSecondsLeft(BREATH_PHASES[0].seconds);
    setDone(false);
    setRunning(true);

    let currentPhase = 0;
    let currentCycle = 1;
    let left: number = BREATH_PHASES[0].seconds;

    timerRef.current = setInterval(() => {
      left -= 1;
      if (left > 0) {
        setSecondsLeft(left);
        return;
      }
      currentPhase += 1;
      if (currentPhase >= BREATH_PHASES.length) {
        currentPhase = 0;
        currentCycle += 1;
        if (currentCycle > BREATH_CYCLES) {
          stop();
          setDone(true);
          return;
        }
        setCycle(currentCycle);
      }
      left = BREATH_PHASES[currentPhase].seconds;
      setPhaseIndex(currentPhase);
      setSecondsLeft(left);
    }, 1000);
  };

  const phase = BREATH_PHASES[phaseIndex];
  const scale = phase.label === 'Tarik napas' ? 1.35 : phase.label === 'Tahan' ? 1.35 : 1;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-center backdrop-blur-md">
      <h3 className="text-base font-medium text-[#ece7db]">Latihan napas</h3>
      <p className="mt-1 text-xs leading-relaxed text-[#a7b8c4]">
        Tarik 4, tahan 4, buang 6. Empat putaran.
      </p>

      <div className="mx-auto mt-6 flex h-40 w-40 items-center justify-center">
        <div
          className="flex h-32 w-32 items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(147,184,164,0.35)_0%,rgba(147,184,164,0.12)_70%)] transition-transform ease-in-out"
          style={{
            transform: `scale(${running ? scale : 1})`,
            transitionDuration: `${running ? phase.seconds : 1}s`,
          }}
        >
          <span className="px-3 text-center text-sm text-[#ece7db]">
            {done ? 'Selesai' : running ? phase.label : 'Siap?'}
          </span>
        </div>
      </div>

      <p className="mt-2 text-2xl tabular-nums text-[#ece7db]">
        {running ? secondsLeft : done ? '✓' : '—'}
      </p>
      <p className="mt-1 text-xs text-[#a7b8c4]">
        {done
          ? 'Selesai. Gimana rasanya?'
          : running
            ? `Putaran ${cycle} dari ${BREATH_CYCLES}`
            : 'Mulai kalau udah siap.'}
      </p>

      <div className="mt-5 flex justify-center gap-3">
        {running ? (
          <button
            type="button"
            onClick={stop}
            className="rounded-full border border-white/15 px-5 py-2 text-sm text-[#ece7db] transition hover:bg-white/10"
          >
            Berhenti
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-[#ece7db] px-5 py-2 text-sm font-medium text-[#0c1a2a] transition hover:bg-white"
          >
            {done ? 'Ulangi latihan' : 'Mulai'}
          </button>
        )}
      </div>
    </div>
  );
}
