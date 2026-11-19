import type { CompanionSuggestion } from '@/types';

/**
 * Pendamping di vibeS BUKAN terapis dan BUKAN tenaga medis.
 * Mesin di bawah ini hanya mencocokkan pola kata, lalu membalas dengan
 * kalimat suportif yang sudah disiapkan. Tidak ada model AI di sini,
 * tidak ada data yang dikirim ke server, dan percakapan tidak disimpan.
 *
 * Kalau pengguna mengungkapkan pikiran menyakiti diri, balasan krisis
 * dan kartu bantuan selalu ditampilkan.
 */

export const CRISIS_INFO = {
  phoneLabel: '119 lalu tekan 8',
  phoneHref: 'tel:119',
  siteLabel: 'healing119.id',
  siteHref: 'https://healing119.id',
  note: 'Layanan Healing119 dari Kemenkes, gratis, 24 jam.',
} as const;

export const BREATH_PHASES = [
  { label: 'Tarik napas', seconds: 4 },
  { label: 'Tahan', seconds: 4 },
  { label: 'Buang napas', seconds: 6 },
] as const;

export const BREATH_CYCLES = 4;

const CRISIS_PATTERNS = [
  /bunuh diri/,
  /mengakhiri hidup/,
  /akhiri hidup/,
  /tidak mau hidup/,
  /nggak mau hidup/,
  /gak mau hidup/,
  /tidak ingin hidup/,
  /ingin mati/,
  /pengen mati/,
  /mau mati/,
  /lebih baik mati/,
  /menyakiti diri/,
  /sakiti diri/,
  /melukai diri/,
  /self[- ]?harm/,
];

export function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_PATTERNS.some((pattern) => pattern.test(lower));
}

export const CRISIS_REPLY =
  'Terima kasih sudah cerita sejujur itu. Kalau pikiran itu terasa kuat sekarang, kamu tidak harus menghadapinya sendirian. Hubungi 119 lalu tekan 8, itu layanan Healing119 dari Kemenkes, gratis dan 24 jam. Kalau ada orang yang kamu percaya di dekatmu, ceritakan ke dia sekarang juga.';

interface Pattern {
  id: string;
  match: RegExp;
  suggestion: CompanionSuggestion | null;
  replies: string[];
}

const PATTERNS: Pattern[] = [
  {
    id: 'greeting',
    match: /^(halo|hai|hei|selamat (pagi|siang|sore|malam)|pagi|siang|sore|malam)\b/,
    suggestion: null,
    replies: [
      'Halo. Cerita aja, pelan-pelan.',
      'Halo, aku dengerin.',
    ],
  },
  {
    id: 'sad',
    match: /sedih|kecewa|patah hati|nangis|menangis|galau|hampa|murung|sedih banget/,
    suggestion: 'music',
    replies: [
      'Aku dengerin. Hari ini berat ya?',
      'Sini, cerita aja. Aku dengerin.',
    ],
  },
  {
    id: 'anxious',
    match: /cemas|khawatir|takut|panik|gelisah|deg-degan|overthinking|banyak pikiran|was-was/,
    suggestion: 'breathing',
    replies: [
      'Tarik napas dulu, bareng aku.',
      'Pelan-pelan. Kita napas bareng.',
    ],
  },
  {
    id: 'angry',
    match: /marah|kesal|kesel|jengkel|benci|sebal|dongkol/,
    suggestion: 'breathing',
    replies: [
      'Wajar marah. Ceritain aja.',
      'Aku dengerin, nggak menghakimi.',
    ],
  },
  {
    id: 'tired',
    match: /lelah|capek|stres|stress|penat|burnout|jenuh|letih|capek banget/,
    suggestion: 'breathing',
    replies: [
      'Kamu pasti capek banget. Istirahat dulu.',
      'Udah cukup hari ini. Duduk dulu.',
    ],
  },
  {
    id: 'lonely',
    match: /sendiri|kesepian|sepi|sendirian|tidak ada yang|nggak ada yang|gak ada yang/,
    suggestion: 'photo',
    replies: [
      'Aku di sini. Kamu nggak sendiri.',
      'Sini, aku temenin.',
    ],
  },
  {
    id: 'failure',
    match: /gagal|tidak bisa|nggak bisa|gak bisa|bodoh|tidak berguna|menyerah|tidak ada gunanya/,
    suggestion: 'music',
    replies: [
      'Gagal sekali bukan berarti kamu gagal.',
      'Nggak apa-apa. Istirahat dulu.',
    ],
  },
  {
    id: 'sleep',
    match: /susah tidur|tidak bisa tidur|insomnia|nggak bisa tidur|gak bisa tidur|begadang/,
    suggestion: 'breathing',
    replies: [
      'Pikiran lagi rame ya? Napas bareng yuk.',
      'Coba napas dulu, pelan-pelan.',
    ],
  },
  {
    id: 'thanks',
    match: /makasih|terima kasih|thanks|thank you|terimakasih/,
    suggestion: null,
    replies: [
      'Sama-sama.',
      'Senang bisa nemenin.',
    ],
  },
];

const FALLBACK_REPLIES = [
  'Aku dengerin. Cerita lagi?',
  'Terus, gimana lagi?',
  'Hmm. Cerita aja terus.',
];

export interface CompanionReply {
  text: string;
  suggestion: CompanionSuggestion | null;
  crisis: boolean;
}

export function replyFor(text: string, turn: number): CompanionReply {
  if (detectCrisis(text)) {
    return { text: CRISIS_REPLY, suggestion: null, crisis: true };
  }
  const lower = text.toLowerCase();
  for (const pattern of PATTERNS) {
    if (pattern.match.test(lower)) {
      const reply = pattern.replies[turn % pattern.replies.length];
      return { text: reply, suggestion: pattern.suggestion, crisis: false };
    }
  }
  return {
    text: FALLBACK_REPLIES[turn % FALLBACK_REPLIES.length],
    suggestion: null,
    crisis: false,
  };
}
