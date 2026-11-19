'use client';

import { useEffect, useRef, useState } from 'react';
import { CRISIS_INFO, CRISIS_REPLY, replyFor } from '@/lib/companion';
import { BreathingExercise } from '@/components/BreathingExercise';
import type { CompanionMessage, CompanionSuggestion } from '@/types';

interface CompanionProps {
  onPlayFavorite: () => void;
  onOpenPhotos: () => void;
}

const QUICK_PROMPTS = [
  'Aku lagi sedih',
  'Aku cemas',
  'Aku lelah',
  'Aku kesepian',
  'Aku susah tidur',
];

const GREETING: CompanionMessage = {
  id: 'greeting',
  role: 'companion',
  text: 'Halo, aku Teman. Cerita aja, pelan-pelan.',
};

/**
 * Teman: pendamping suportif berbasis pola kata.
 * Bukan terapis, bukan tenaga medis, bukan pengganti bantuan profesional.
 * Percakapan hanya ada di layar ini dan tidak disimpan.
 */
export function Companion({ onPlayFavorite, onOpenPhotos }: CompanionProps) {
  const [messages, setMessages] = useState<CompanionMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [showBreathing, setShowBreathing] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const turnRef = useRef(0);
  const idRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  const nextId = (prefix: string) => {
    idRef.current += 1;
    return `${prefix}-${idRef.current}`;
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, showBreathing]);

  const push = (msg: CompanionMessage) => setMessages((prev) => [...prev, msg]);

  const handleSuggestion = (suggestion: CompanionSuggestion) => {
    if (suggestion === 'breathing') setShowBreathing(true);
    if (suggestion === 'music') onPlayFavorite();
    if (suggestion === 'photo') onOpenPhotos();
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput('');
    setShowBreathing(false);
    push({ id: nextId('user'), role: 'user', text: trimmed });
    turnRef.current += 1;
    const reply = replyFor(trimmed, turnRef.current);
    window.setTimeout(() => {
      if (reply.crisis) {
        setShowCrisis(true);
        push({ id: nextId('crisis'), role: 'crisis', text: CRISIS_REPLY });
      } else {
        push({
          id: nextId('companion'),
          role: 'companion',
          text: reply.text,
          suggestion: reply.suggestion,
        });
      }
    }, 600);
  };

  const suggestionLabel: Record<CompanionSuggestion, string> = {
    breathing: 'Latihan napas',
    music: 'Putar lagu',
    photo: 'Buka foto',
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-light tracking-wide text-[#ece7db]">Teman</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#a7b8c4]">
          Aku bukan terapis. Aku di sini buat dengerin, dan obrolan ini tidak disimpan.
        </p>
        <button
          type="button"
          onClick={() => setShowCrisis((v) => !v)}
          className="mt-3 rounded-full border border-[#e8a598]/50 px-4 py-1.5 text-xs text-[#e8a598] transition hover:bg-[#e8a598]/10"
        >
          Butuh bantuan sekarang?
        </button>
      </header>

      {showCrisis && (
        <div className="rounded-3xl border border-[#e8a598]/60 bg-[#e8a598]/10 p-5">
          <p className="text-sm font-medium text-[#ece7db]">
            Kalau kamu merasa tidak aman sekarang, segera hubungi bantuan.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#ece7db]/85">
            Telepon <a className="font-medium underline" href={CRISIS_INFO.phoneHref}>{CRISIS_INFO.phoneLabel}</a>{' '}
            (Healing119, Kemenkes) atau buka{' '}
            <a className="font-medium underline" href={CRISIS_INFO.siteHref} target="_blank" rel="noreferrer">
              {CRISIS_INFO.siteLabel}
            </a>
            . {CRISIS_INFO.note} Ceritakan juga ke orang yang kamu percaya.
          </p>
        </div>
      )}

      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
        <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#93b8a4]/25 text-[#ece7db]'
                    : msg.role === 'crisis'
                      ? 'border border-[#e8a598]/60 bg-[#e8a598]/10 text-[#ece7db]'
                      : 'bg-white/[0.07] text-[#ece7db]'
                }`}
              >
                <p>{msg.text}</p>
                {msg.role === 'companion' && msg.suggestion && (
                  <button
                    type="button"
                    onClick={() => handleSuggestion(msg.suggestion as CompanionSuggestion)}
                    className="mt-3 rounded-full border border-white/20 px-3 py-1.5 text-xs text-[#ece7db] transition hover:bg-white/10"
                  >
                    {suggestionLabel[msg.suggestion as CompanionSuggestion]}
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => send(prompt)}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#a7b8c4] transition hover:border-white/30 hover:text-[#ece7db]"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 pt-1"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis yang kamu rasakan..."
            aria-label="Tulis yang kamu rasakan"
            className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm text-[#ece7db] placeholder:text-[#a7b8c4]/60 focus:border-[#93b8a4]/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="shrink-0 rounded-full bg-[#ece7db] px-5 py-3 text-sm font-medium text-[#0c1a2a] transition hover:bg-white disabled:opacity-50"
          >
            Kirim
          </button>
        </form>
      </div>

      {showBreathing && (
        <div>
          <BreathingExercise />
          <button
            type="button"
            onClick={() => setShowBreathing(false)}
            className="mt-3 w-full text-center text-xs text-[#a7b8c4] underline-offset-2 hover:underline"
          >
            Tutup latihan napas
          </button>
        </div>
      )}
    </div>
  );
}
